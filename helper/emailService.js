const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

const sendMFAEmail = async (email, step, correctNumber, totalSteps = 1) => {
  const mailOptions = {
    from: `"SNTP Admin" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `🔐 Code d'authentification MFA - Étape ${step}/${totalSteps}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          .header .step-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 14px;
            margin-top: 10px;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .code-section {
            margin: 40px 0;
          }
          .code-label {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
            font-weight: 600;
          }
          .code-display {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 72px;
            font-weight: bold;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
            letter-spacing: 8px;
            display: inline-block;
            min-width: 200px;
          }
          .instruction-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            text-align: left;
          }
          .instruction-box h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 18px;
          }
          .instruction-box ol {
            margin: 10px 0 10px 20px;
            color: #555;
          }
          .instruction-box li {
            margin: 8px 0;
            line-height: 1.8;
          }
          .warning-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
          }
          .warning-box p {
            margin: 8px 0;
            color: #856404;
          }
          .warning-icon {
            font-size: 20px;
            margin-right: 5px;
          }
          .security-notice {
            background: #e7f3ff;
            border: 1px solid #b3d9ff;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .security-notice h4 {
            color: #0066cc;
            margin-bottom: 10px;
          }
          .security-notice ul {
            margin: 10px 0 0 20px;
            color: #004999;
          }
          .security-notice li {
            margin: 5px 0;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 13px;
            border-top: 1px solid #dee2e6;
          }
          .footer p {
            margin: 5px 0;
          }
          .footer strong {
            color: #333;
          }
          @media (max-width: 600px) {
            .code-display {
              font-size: 56px;
              padding: 30px 20px;
            }
            .content {
              padding: 30px 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Code d'Authentification</h1>
            <div class="step-badge">Étape ${step} / ${totalSteps}</div>
          </div>
          
          <div class="content">
            <div class="code-section">
              <p class="code-label">Votre code de vérification :</p>
              <div class="code-display">${correctNumber}</div>
            </div>
            
            <div class="instruction-box">
              <h3>📋 Instructions</h3>
              <ol>
                <li><strong>Revenez sur la page de connexion</strong></li>
                <li>Vous verrez <strong>3 nombres différents</strong> affichés</li>
                <li><strong>Cliquez sur le nombre ${correctNumber}</strong> qui correspond au code ci-dessus</li>
                ${totalSteps > 1 ? `<li>Répétez cette opération pour les ${totalSteps} étapes</li>` : ''}
              </ol>
            </div>
            
            <div class="warning-box">
              <p><span class="warning-icon">⏱️</span> <strong>Temps limité :</strong> Vous avez 2 minutes pour compléter cette étape.</p>
              <p><span class="warning-icon">🔒</span> <strong>Sécurité :</strong> Après 3 tentatives échouées, votre session sera verrouillée pendant 15 minutes.</p>
            </div>

            <div class="security-notice">
              <h4>🛡️ Consignes de sécurité</h4>
              <ul>
                <li>Ne partagez jamais ce code avec qui que ce soit</li>
                <li>L'équipe SNTP ne vous demandera jamais ce code par téléphone ou email</li>
                <li>Si vous n'avez pas demandé cette authentification, contactez immédiatement l'administrateur</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>SNTP - Société Nationale des Travaux Publics</strong></p>
            <p>Panel d'Administration Sécurisé</p>
            <p style="margin-top: 15px;">Cet email a été généré automatiquement dans le cadre de votre authentification multifacteur.</p>
            <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email et contactez l'administrateur système.</p>
            <p style="margin-top: 15px; color: #999;">© ${new Date().getFullYear()} SNTP - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✓ Email MFA envoyé à ${email} pour l'étape ${step}/${totalSteps} - Code: ${correctNumber}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Erreur envoi email MFA:', error.message);
    return { success: false, error: error.message };
  }
};

const sendMFASuccessEmail = async (email) => {
  const mailOptions = {
    from: `"SNTP Admin" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '✅ Connexion réussie - SNTP Admin',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .success-icon {
            font-size: 80px;
            margin: 20px 0;
          }
          .info-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: left;
          }
          .info-box p {
            margin: 10px 0;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 13px;
            border-top: 1px solid #dee2e6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Authentification Réussie</h1>
          </div>
          
          <div class="content">
            <div class="success-icon">🎉</div>
            <h2>Connexion confirmée avec succès !</h2>
            <p>Vous vous êtes connecté au panel d'administration SNTP.</p>
            
            <div class="info-box">
              <p><strong>📧 Email :</strong> ${email}</p>
              <p><strong>📅 Date :</strong> ${new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>🕐 Heure :</strong> ${new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
            
            <p style="color: #dc3545; margin-top: 25px;">
              <strong>⚠️ Si vous n'êtes pas à l'origine de cette connexion,</strong><br>
              veuillez contacter immédiatement l'administrateur système.
            </p>
          </div>
          
          <div class="footer">
            <p><strong>SNTP - Société Nationale des Travaux Publics</strong></p>
            <p>© ${new Date().getFullYear()} SNTP - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✓ Email de confirmation envoyé à ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Erreur envoi email confirmation:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendMFAEmail,
  sendMFASuccessEmail
};

