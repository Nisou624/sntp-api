const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  motDePasse: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'editeur', 'lecteur'],
    default: 'editeur'
  },
  telephone: {
    type: String
  },
  service: {
    type: String
  },
  avatar: {
    type: String
  },
  actif: {
    type: Boolean,
    default: true
  },
  derniereConnexion: {
    type: Date
  },
  tentativesConnexion: {
    type: Number,
    default: 0
  },
  dateVerrouillage: {
    type: Date
  },
  tokenResetPassword: String,
  tokenResetPasswordExpire: Date,
  permissions: [{
    type: String,
    enum: ['creer', 'modifier', 'supprimer', 'publier', 'voir_stats']
  }]
}, {
  timestamps: true
});

// Hash du mot de passe avant sauvegarde
adminSchema.pre('save', async function(next) {
  if (!this.isModified('motDePasse')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
adminSchema.methods.comparerMotDePasse = async function(motDePasseCandidat) {
  return await bcrypt.compare(motDePasseCandidat, this.motDePasse);
};

// Méthode pour générer un token de réinitialisation
adminSchema.methods.genererTokenReset = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.tokenResetPassword = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.tokenResetPasswordExpire = Date.now() + 3600000; // 1 heure
  
  return resetToken;
};

// Méthode pour incrémenter les tentatives de connexion
adminSchema.methods.incrementerTentatives = function() {
  this.tentativesConnexion += 1;
  if (this.tentativesConnexion >= 5) {
    this.dateVerrouillage = Date.now() + 1800000; // Verrouillage 30 minutes
  }
  return this.save();
};

// Méthode pour réinitialiser les tentatives
adminSchema.methods.reinitialiserTentatives = function() {
  this.tentativesConnexion = 0;
  this.dateVerrouillage = undefined;
  return this.save();
};

module.exports = mongoose.model('Admin', adminSchema);

