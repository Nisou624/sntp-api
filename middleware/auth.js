const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Middleware de protection des routes
exports.proteger = async (req, res, next) => {
  try {
    let token;

    // Récupérer le token depuis les headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Token manquant.'
      });
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Trouver l'utilisateur
      req.admin = await Admin.findById(decoded.id).select('-motDePasse');

      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé.'
        });
      }

      // Vérifier si l'admin est actif
      if (!req.admin.actif) {
        return res.status(403).json({
          success: false,
          message: 'Compte désactivé.'
        });
      }

      // Vérifier si le compte est verrouillé
      if (req.admin.dateVerrouillage && req.admin.dateVerrouillage > Date.now()) {
        return res.status(403).json({
          success: false,
          message: 'Compte temporairement verrouillé. Réessayez plus tard.'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré.'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'authentification.',
      error: error.message
    });
  }
};

// Middleware pour autoriser certains rôles
exports.autoriser = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Le rôle ${req.admin.role} n'est pas autorisé à accéder à cette ressource.`
      });
    }
    next();
  };
};

// Middleware pour vérifier les permissions spécifiques
exports.verifierPermission = (permission) => {
  return (req, res, next) => {
    if (req.admin.role === 'super_admin') {
      return next();
    }

    if (!req.admin.permissions || !req.admin.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas la permission requise pour cette action.'
      });
    }
    next();
  };
};

