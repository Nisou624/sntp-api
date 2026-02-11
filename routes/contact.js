// routes/contact.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');

// ✅ Configuration du transporteur (IDENTIQUE à candidature)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Route POST pour envoyer un message de contact
 * @route POST /api/contact/send-message
 */
router.post(
  '/send-message',
  [
    body('nom')
      .trim()
      .notEmpty()
      .withMessage('Le nom est requis')
      .isLength({ min: 2 })
      .withMessage('Le nom doit contenir au moins 2 caractères'),
    
    body('email')
      .isEmail()
      .withMessage('Email invalide'),
    
    body('telephone')
      .optional({ checkFalsy: true })
      .matches(/^(0)(2|1|3|5|6|7|9)[0-9]{8}$/)
      .withMessage('Numéro de téléphone algérien invalide'),
    
    body('sujet')
      .trim()
      .notEmpty()
      .withMessage('Le sujet est requis'),
    
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Le message est requis')
      .isLength({ min: 10 })
      .withMessage('Le message doit contenir au moins 10 caractères')
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

      const { nom, email, telephone, sujet, message } = req.body;

      // Log de débogage
      console.log('📧 Envoi message de contact:', {
        de: email,
        nom: nom,
        sujet: sujet
      });

      // ✅ Préparer l'email (IDENTIQUE à la structure de candidature)
      const mailOptions = {
        from: `SNTP - Site Web <${process.env.SMTP_USER}>`,
        to: process.env.CONTACT_EMAIL || process.env.SMTP_USER, // Destinataire
        replyTo: email, // L'email du visiteur pour répondre
        subject: `[SNTP Contact] ${sujet}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #DC143C, #B01030);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border: 1px solid #e0e0e0;
    }
    .info-section {
      background: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .info-section h2 {
      color: #DC143C;
      font-size: 18px;
      margin-top: 0;
      border-bottom: 2px solid #DC143C;
      padding-bottom: 10px;
    }
    .info-row {
      display: flex;
      margin-bottom: 12px;
    }
    .info-label {
      font-weight: bold;
      min-width: 120px;
      color: #666;
    }
    .info-value {
      color: #333;
    }
    .message-box {
      background: #f5f5f5;
      padding: 15px;
      border-left: 4px solid #DC143C;
      margin-top: 15px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 12px;
      background: #f0f0f0;
      border-radius: 0 0 10px 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 Nouveau Message de Contact</h1>
    </div>
    
    <div class="content">
      <div class="info-section">
        <h2>👤 Informations de l'expéditeur</h2>
        <div class="info-row">
          <div class="info-label">Nom :</div>
          <div class="info-value"><strong>${nom}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">Email :</div>
          <div class="info-value"><a href="mailto:${email}">${email}</a></div>
        </div>
        ${telephone ? `
        <div class="info-row">
          <div class="info-label">Téléphone :</div>
          <div class="info-value">${telephone}</div>
        </div>
        ` : ''}
        <div class="info-row">
          <div class="info-label">Date :</div>
          <div class="info-value">${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' })}</div>
        </div>
      </div>

      <div class="info-section">
        <h2>📋 Sujet</h2>
        <p><strong>${sujet}</strong></p>
      </div>

      <div class="info-section">
        <h2>💬 Message</h2>
        <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
      </div>
    </div>

    <div class="footer">
      <p><strong>SNTP - Société Nationale des Travaux Publics</strong></p>
      <p>Cet email a été envoyé automatiquement depuis le formulaire de contact du site web SNTP.</p>
      <p>Date de réception : ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' })}</p>
    </div>
  </div>
</body>
</html>
        `
      };

      // ✅ Envoyer l'email (IDENTIQUE à candidature)
      await transporter.sendMail(mailOptions);

      console.log('✅ Email de contact envoyé avec succès');

      res.status(200).json({
        success: true,
        message: 'Votre message a été envoyé avec succès. Nous vous contacterons bientôt.'
      });

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message de contact:', error);
      res.status(500).json({
        success: false,
        message: 'Une erreur est survenue lors de l\'envoi de votre message. Veuillez réessayer ultérieurement.'
      });
    }
  }
);

module.exports = router;

