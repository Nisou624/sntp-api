// routes/candidature.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');

// Configuration de Multer pour stocker en mémoire
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 3 * 1024 * 1024 // 3 Mo maximum
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Seuls PDF, DOC et DOCX sont acceptés.'), false);
    }
  }
});

// Configuration du transporteur Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true pour le port 465, false pour les autres ports
  auth: {
    user: process.env.SMTP_USER, // Votre adresse email SNTP
    pass: process.env.SMTP_PASSWORD // Mot de passe d'application
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Route POST pour candidature spontanée
router.post(
  '/candidature-spontanee',
  upload.single('cv'),
  [
    body('civilite').notEmpty().withMessage('La civilité est requise'),
    body('nom').trim().notEmpty().withMessage('Le nom est requis').isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
    body('prenom').trim().notEmpty().withMessage('Le prénom est requis').isLength({ min: 2 }).withMessage('Le prénom doit contenir au moins 2 caractères'),
    body('email').isEmail().withMessage('Email invalide'),
    body('telephone').matches(/^(0|\+213)[5-7][0-9]{8}$/).withMessage('Numéro de téléphone algérien invalide'),
    body('wilaya').notEmpty().withMessage('La wilaya est requise'),
    body('metier').notEmpty().withMessage('Le métier est requis'),
    body('motivation').trim().notEmpty().withMessage('La motivation est requise').isLength({ min: 50 }).withMessage('La motivation doit contenir au moins 50 caractères')
  ],
  async (req, res) => {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erreur de validation',
          errors: errors.array()
        });
      }

      // Vérifier que le fichier CV est présent
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Le CV est obligatoire'
        });
      }

      const { civilite, nom, prenom, email, telephone, wilaya, metier, motivation } = req.body;
      const cv = req.file;

      // Préparer l'email
      const mailOptions = {
        from: `"SNTP - Recrutement" <${process.env.SMTP_USER}>`,
        to: process.env.RECRUITMENT_EMAIL || 'recrutement@sntp.dz', // Email de destination
        cc: process.env.RECRUITMENT_CC_EMAIL || '', // Copie optionnelle
        subject: `Candidature Spontanée - ${prenom} ${nom} (${metier})`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #DC143C, #B01030); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; }
              .info-section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .info-section h2 { color: #DC143C; font-size: 18px; margin-top: 0; border-bottom: 2px solid #DC143C; padding-bottom: 10px; }
              .info-row { display: flex; margin-bottom: 12px; }
              .info-label { font-weight: bold; min-width: 120px; color: #666; }
              .info-value { color: #333; }
              .motivation-box { background: #f5f5f5; padding: 15px; border-left: 4px solid #DC143C; margin-top: 15px; font-style: italic; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f0f0f0; border-radius: 0 0 10px 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📋 Nouvelle Candidature Spontanée</h1>
              </div>
              
              <div class="content">
                <div class="info-section">
                  <h2>👤 Informations du candidat</h2>
                  <div class="info-row">
                    <div class="info-label">Civilité :</div>
                    <div class="info-value">${civilite}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Nom :</div>
                    <div class="info-value">${nom.toUpperCase()}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Prénom :</div>
                    <div class="info-value">${prenom}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Email :</div>
                    <div class="info-value"><a href="mailto:${email}">${email}</a></div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Téléphone :</div>
                    <div class="info-value">${telephone}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Wilaya :</div>
                    <div class="info-value">${wilaya}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Métier visé :</div>
                    <div class="info-value"><strong>${metier}</strong></div>
                  </div>
                </div>

                <div class="info-section">
                  <h2>✍️ Lettre de motivation</h2>
                  <div class="motivation-box">
                    ${motivation.replace(/\n/g, '<br>')}
                  </div>
                </div>

                <div class="info-section">
                  <h2>📎 Pièce jointe</h2>
                  <div class="info-row">
                    <div class="info-label">CV :</div>
                    <div class="info-value">${cv.originalname} (${(cv.size / 1024).toFixed(2)} Ko)</div>
                  </div>
                </div>
              </div>

              <div class="footer">
                <p><strong>SNTP - Société Nationale des Travaux Publics</strong></p>
                <p>Cet email a été envoyé automatiquement depuis le formulaire de candidature spontanée du site web SNTP.</p>
                <p>Date de réception : ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' })}</p>
              </div>
            </div>
          </body>
          </html>
        `,
        attachments: [
          {
            filename: cv.originalname,
            content: cv.buffer,
            contentType: cv.mimetype
          }
        ]
      };

      // Envoyer l'email
      await transporter.sendMail(mailOptions);

      // (Optionnel) Enregistrer en base de données
      // await saveCandidatureToDatabase({ civilite, nom, prenom, email, telephone, wilaya, metier, motivation, cvName: cv.originalname });

      res.status(200).json({
        success: true,
        message: 'Votre candidature a été envoyée avec succès. Nous vous contacterons prochainement.'
      });

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la candidature:', error);
      
      res.status(500).json({
        success: false,
        message: 'Une erreur est survenue lors de l\'envoi de votre candidature. Veuillez réessayer ultérieurement.'
      });
    }
  }
);

module.exports = router;

