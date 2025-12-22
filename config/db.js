// config/db.js - Version simplifiée compatible
const sequelize = require('./database');

module.exports = {
  sequelize,
  testConnection: async () => {
    try {
      await sequelize.authenticate();
      console.log('✓ Connexion à la base de données établie avec succès.');
      return true;
    } catch (error) {
      console.error('✗ Impossible de se connecter à la base de données:', error.message);
      return false;
    }
  },
  syncDatabase: async (force = false) => {
    try {
      await sequelize.sync({ 
        force: force, 
        alter: !force && process.env.NODE_ENV === 'development' 
      });
      console.log(`✓ Base de données synchronisée ${force ? '(tables recréées)' : '(structure mise à jour)'}`);
    } catch (error) {
      console.error('✗ Erreur lors de la synchronisation:', error);
      throw error;
    }
  },
  Sequelize: require('sequelize').Sequelize
};
