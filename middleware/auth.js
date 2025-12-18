// middleware/auth.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    
    console.log('🔐 Auth Header:', authHeader ? 'Présent' : 'Absent');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Token manquant ou format incorrect');
      return res.status(401).json({ 
        success: false, 
        message: 'Token manquant. Veuillez vous connecter.' 
      });
    }
    
    // Extraire le token (enlever "Bearer ")
    const token = authHeader.substring(7);
    
    console.log('🔑 Token reçu:', token ? token.substring(0, 20) + '...' : 'null');
    console.log('🔒 JWT_SECRET:', process.env.JWT_SECRET ? 'Défini' : 'Non défini');
    
    if (!token) {
      console.log('❌ Token vide après extraction');
      return res.status(401).json({ 
        success: false, 
        message: 'Token manquant' 
      });
    }
    
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('✅ Token valide pour:', decoded);
    
    // Ajouter les infos de l'utilisateur à la requête
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalide' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expiré. Veuillez vous reconnecter.' 
      });
    }
    
    res.status(401).json({ 
      success: false, 
      message: 'Erreur d\'authentification' 
    });
  }
};

module.exports = authMiddleware;
