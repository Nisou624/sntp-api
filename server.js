const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/database');
const appelOffresRoutes = require('./routes/appelOffres');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/appels-offres', appelOffresRoutes);

// Route de base
app.get('/', (req, res) => {
  res.json({
    message: 'API SNTP - Gestion des Appels d\'Offres',
    version: '1.0.0',
    endpoints: {
      appelsOffres: '/api/appels-offres',
      statistics: '/api/appels-offres/statistics'
    }
  });
});

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialisation et démarrage du serveur
const startServer = async () => {
  try {
    // Initialiser la base de données
    await db.initDatabase();
    
    // Tester la connexion
    await db.testConnection();
    
    // Créer les tables
    await db.createTables();
    
    // Insérer les données d'exemple
    await db.insertSampleData();
    
    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`\n🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n📋 Endpoints disponibles:`);
      console.log(`   - GET    http://localhost:${PORT}/api/appels-offres`);
      console.log(`   - GET    http://localhost:${PORT}/api/appels-offres/:id`);
      console.log(`   - POST   http://localhost:${PORT}/api/appels-offres`);
      console.log(`   - PUT    http://localhost:${PORT}/api/appels-offres/:id`);
      console.log(`   - DELETE http://localhost:${PORT}/api/appels-offres/:id`);
      console.log(`   - GET    http://localhost:${PORT}/api/appels-offres/statistics\n`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error.message);
    process.exit(1);
  }
};

// Gestion de l'arrêt gracieux
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT reçu, arrêt du serveur...');
  process.exit(0);
});

// Démarrer le serveur
startServer();

module.exports = app;

