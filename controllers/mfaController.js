const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Admin = require('../models/Admin');
const MFASession = require('../models/MFASession');
const { sendMFAEmail, sendMFASuccessEmail } = require('../helper/emailService');

const MFA_STEPS = parseInt(process.env.MFA_STEPS) || 1; // Nombre d'étapes configurables

// Générer un nombre aléatoire entre 10 et 99
const generateRandomNumber = () => {
  return Math.floor(Math.random() * 90) + 10;
};

// Générer 2 nombres leurres différents du nombre correct
const generateDecoyNumbers = (correctNumber) => {
  const decoys = [];
  while (decoys.length < 2) {
    const decoy = generateRandomNumber();
    if (decoy !== correctNumber && !decoys.includes(decoy)) {
      decoys.push(decoy);
    }
  }
  return decoys;
};

// Générer un token JWT
const genererToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Initier une session MFA après login réussi
// @route   POST /api/mfa/initiate
// @access  Public
exports.initiateMFA = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    console.log('🔐 Tentative de connexion:', email);

    if (!email || !motDePasse) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis.'
      });
    }

    const admin = await Admin.findOne({ where: { email } });
    
    if (!admin) {
      console.log('❌ Admin non trouvé:', email);
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides.'
      });
    }

    if (!admin.actif) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur.'
      });
    }

    if (admin.dateVerrouillage && new Date(admin.dateVerrouillage) > new Date()) {
      const minutesRestantes = Math.ceil((new Date(admin.dateVerrouillage) - new Date()) / 60000);
      return res.status(403).json({
        success: false,
        message: `Compte verrouillé. Réessayez dans ${minutesRestantes} minute(s).`
      });
    }

    const motDePasseValide = await admin.comparerMotDePasse(motDePasse);
    if (!motDePasseValide) {
      console.log('❌ Mot de passe invalide pour:', email);
      await admin.incrementerTentatives();
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides.'
      });
    }

    await admin.reinitialiserTentatives();
    console.log('✅ Identifiants valides pour:', email);

    await MFASession.destroy({ 
      where: { 
        email: admin.email,
        completed: false
      }
    });

    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionTimeout = 15 * 60 * 1000;
    
    const correctNumber = generateRandomNumber();
    const decoyNumbers = generateDecoyNumbers(correctNumber);
    const allNumbers = [correctNumber, ...decoyNumbers].sort(() => Math.random() - 0.5);
    
    console.log('📊 Nombres générés - Correct:', correctNumber, '| Leurres:', decoyNumbers, '| Mélangés:', allNumbers);

    const numbersData = [{
      step: 1,
      correctNumber,
      decoyNumbers,
      allNumbersShuffled: allNumbers,
      startTime: new Date(),
      completed: false,
      attempts: 0
    }];

    const mfaSession = await MFASession.create({
      sessionId,
      email: admin.email,
      currentStep: 1,
      numbers: numbersData,
      expiresAt: new Date(Date.now() + sessionTimeout)
    });

    console.log('✅ Session MFA créée:', sessionId);

    const emailResult = await sendMFAEmail(admin.email, 1, correctNumber, MFA_STEPS);
    
    if (!emailResult.success) {
      console.error('❌ Échec envoi email');
      await mfaSession.destroy();
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.'
      });
    }

    console.log('✅ Email MFA envoyé avec succès');

    res.status(200).json({
      success: true,
      message: 'Authentification MFA initiée. Vérifiez votre email pour voir le nombre correct.',
      sessionId,
      step: 1,
      totalSteps: MFA_STEPS,
      numbersToSelect: allNumbers,
      expiresIn: 120
    });
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERREUR INITIATION MFA:');
    console.error(error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'initiation MFA.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Vérifier un nombre pour une étape MFA
// @route   POST /api/mfa/verify
// @access  Public
exports.verifyMFAStep = async (req, res) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 VÉRIFICATION MFA DÉMARRÉE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const { sessionId, selectedNumber } = req.body;

    console.log('📥 Données reçues:');
    console.log('  - SessionID:', sessionId);
    console.log('  - Nombre sélectionné:', selectedNumber);
    console.log('  - Type:', typeof selectedNumber);

    if (!sessionId || selectedNumber === undefined || selectedNumber === null) {
      console.log('❌ Données manquantes');
      return res.status(400).json({
        success: false,
        message: 'Session ID et nombre sélectionné requis.'
      });
    }

    console.log('🔎 Recherche de la session...');
    const mfaSession = await MFASession.findOne({ where: { sessionId } });
    
    if (!mfaSession) {
      console.log('❌ Session introuvable');
      return res.status(404).json({
        success: false,
        message: 'Session MFA introuvable ou expirée.'
      });
    }

    console.log('✅ Session trouvée:');
    console.log('  - Email:', mfaSession.email);
    console.log('  - Étape actuelle:', mfaSession.currentStep);
    console.log('  - Verrouillée:', mfaSession.isLocked);
    console.log('  - Tentatives échouées:', mfaSession.failedAttempts);

    // Vérifier verrouillage
    if (mfaSession.isLocked && mfaSession.lockExpiry) {
      const lockTimeRemaining = Math.ceil((new Date(mfaSession.lockExpiry) - new Date()) / 60000);
      if (lockTimeRemaining > 0) {
        console.log('🔒 Session verrouillée pour', lockTimeRemaining, 'minutes');
        return res.status(403).json({
          success: false,
          message: `Session verrouillée. Réessayez dans ${lockTimeRemaining} minute(s).`,
          locked: true
        });
      } else {
        console.log('🔓 Déverrouillage de la session');
        mfaSession.isLocked = false;
        mfaSession.failedAttempts = 0;
        await mfaSession.save();
      }
    }

    // Vérifier expiration
    if (mfaSession.isExpired()) {
      console.log('⏱️ Session expirée');
      await mfaSession.destroy();
      return res.status(408).json({
        success: false,
        message: 'Session MFA expirée. Veuillez vous reconnecter.'
      });
    }

    if (mfaSession.isStepExpired()) {
      console.log('⏱️ Étape expirée');
      await mfaSession.destroy();
      return res.status(408).json({
        success: false,
        message: 'Délai dépassé pour cette étape. Veuillez vous reconnecter.'
      });
    }

    const currentStep = mfaSession.currentStep;
    
    console.log('📊 Récupération des données numbers...');
    console.log('  - Type de numbers:', typeof mfaSession.numbers);

    let numbers = mfaSession.numbers;
    
    if (typeof numbers === 'string') {
      console.log('🔄 Parsing JSON des numbers...');
      try {
        numbers = JSON.parse(numbers);
        console.log('✅ JSON parsé avec succès');
      } catch (e) {
        console.error('❌ ERREUR DE PARSING JSON:', e);
        return res.status(500).json({
          success: false,
          message: 'Erreur de données de session.'
        });
      }
    }

    console.log('📋 Nombre d\'étapes dans numbers:', numbers.length);
    const stepData = numbers.find(n => n.step === currentStep);

    if (!stepData) {
      console.error('❌ Données d\'étape introuvables pour l\'étape', currentStep);
      return res.status(500).json({
        success: false,
        message: 'Erreur de session MFA.'
      });
    }

    console.log('✅ Données de l\'étape trouvées:');
    console.log('  - Nombre correct:', stepData.correctNumber);
    console.log('  - Type:', typeof stepData.correctNumber);

    const selectedNum = parseInt(selectedNumber);
    const correctNum = parseInt(stepData.correctNumber);

    console.log('🔢 Comparaison:');
    console.log('  - Sélectionné (converti):', selectedNum);
    console.log('  - Attendu (converti):', correctNum);
    console.log('  - Égalité stricte:', selectedNum === correctNum);

    if (selectedNum !== correctNum) {
      console.log('❌ NOMBRE INCORRECT');
      
      stepData.attempts += 1;
      mfaSession.failedAttempts += 1;
      mfaSession.numbers = numbers;

      const maxAttempts = parseInt(process.env.MFA_MAX_ATTEMPTS) || 3;
      
      console.log('📊 Tentatives:', mfaSession.failedAttempts, '/', maxAttempts);

      if (mfaSession.failedAttempts >= maxAttempts) {
        console.log('🔒 Verrouillage de la session');
        const lockDuration = parseInt(process.env.MFA_LOCK_DURATION) || 900000;
        mfaSession.isLocked = true;
        mfaSession.lockExpiry = new Date(Date.now() + lockDuration);
        await mfaSession.save();

        return res.status(403).json({
          success: false,
          message: 'Trop de tentatives échouées. Session verrouillée pendant 15 minutes.',
          locked: true
        });
      }

      await mfaSession.save();

      return res.status(400).json({
        success: false,
        message: 'Nombre incorrect. Consultez votre email pour voir le code correct.',
        attemptsRemaining: maxAttempts - mfaSession.failedAttempts,
        step: currentStep
      });
    }

    console.log('✅ NOMBRE CORRECT !');
    
    stepData.completed = true;
    stepData.attempts += 1;
    mfaSession.numbers = numbers;

    // Dernière étape ?
    if (currentStep === MFA_STEPS) {
      console.log('🎉 DERNIÈRE ÉTAPE VALIDÉE - AUTHENTIFICATION COMPLÈTE');
      
      mfaSession.completed = true;
      await mfaSession.save();

      const admin = await Admin.findOne({ where: { email: mfaSession.email } });
      
      if (!admin) {
        console.error('❌ Admin introuvable après validation MFA');
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la finalisation de l\'authentification.'
        });
      }

      admin.derniereConnexion = new Date();
      await admin.save();

      const token = genererToken(admin.id);

      await sendMFASuccessEmail(admin.email);
      await mfaSession.destroy();

      console.log('✅ Token généré:', token.substring(0, 20) + '...');
      console.log('✅ Session MFA supprimée');

      return res.status(200).json({
        success: true,
        message: 'Authentification complète !',
        token,
        completed: true,
        admin: {
          id: admin.id,
          nom: admin.nom,
          prenom: admin.prenom,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          avatar: admin.avatar
        }
      });
    }

    // Passer à l'étape suivante
    console.log('➡️ Passage à l\'étape suivante');
    
    mfaSession.currentStep += 1;
    const nextStep = mfaSession.currentStep;

    const nextCorrectNumber = generateRandomNumber();
    const nextDecoyNumbers = generateDecoyNumbers(nextCorrectNumber);
    const nextAllNumbers = [nextCorrectNumber, ...nextDecoyNumbers].sort(() => Math.random() - 0.5);
    
    console.log('📊 Nouveaux nombres - Correct:', nextCorrectNumber, '| Mélangés:', nextAllNumbers);

    numbers.push({
      step: nextStep,
      correctNumber: nextCorrectNumber,
      decoyNumbers: nextDecoyNumbers,
      allNumbersShuffled: nextAllNumbers,
      startTime: new Date(),
      completed: false,
      attempts: 0
    });

    mfaSession.numbers = numbers;
    await mfaSession.save();

    console.log('✅ Session mise à jour pour l\'étape', nextStep);

    await sendMFAEmail(mfaSession.email, nextStep, nextCorrectNumber, MFA_STEPS);
    
    console.log('✅ Email envoyé pour l\'étape', nextStep);

    res.status(200).json({
      success: true,
      message: `Étape ${currentStep} validée. Consultez votre email pour l'étape ${nextStep}.`,
      step: nextStep,
      numbersToSelect: nextAllNumbers,
      totalSteps: MFA_STEPS,
      expiresIn: 120
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ VÉRIFICATION MFA TERMINÉE AVEC SUCCÈS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERREUR VÉRIFICATION MFA:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification MFA.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Annuler une session MFA
// @route   DELETE /api/mfa/cancel/:sessionId
// @access  Public
exports.cancelMFA = async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log('🗑️ Annulation MFA pour session:', sessionId);
    await MFASession.destroy({ where: { sessionId } });

    res.status(200).json({
      success: true,
      message: 'Session MFA annulée.'
    });
  } catch (error) {
    console.error('Erreur annulation MFA:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation MFA.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

