// config/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const config = require('./database.js')[env];

// Créer l'instance Sequelize
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    timezone: config.timezone,
    logging: config.logging,
    pool: config.pool,
    define: config.define
  }
);

// Tester la connexion
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Connexion à la base de données établie avec succès.');
    return true;
  } catch (error) {
    console.error('✗ Impossible de se connecter à la base de données:', error.message);
    return false;
  }
};

// Synchroniser les modèles avec la base de données
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ 
      force: force, 
      alter: !force && env === 'development' 
    });
    console.log(`✓ Base de données synchronisée ${force ? '(tables recréées)' : '(structure mise à jour)'}`);
  } catch (error) {
    console.error('✗ Erreur lors de la synchronisation:', error);
    throw error;
  }
};

// IMPORTANT : Exporter l'instance sequelize ET les fonctions
module.exports = {
  sequelize,        // Instance Sequelize
  testConnection,
  syncDatabase,
  Sequelize         // Classe Sequelize pour les types
};
