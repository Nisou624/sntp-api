const mysql = require('mysql2');
require('dotenv').config();

// Configuration de la connexion à la base de données
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sntp_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Conversion en promesses pour utiliser async/await
const promisePool = pool.promise();

// Test de connexion
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✅ Connexion à MySQL réussie !');
    connection.release();
  } catch (error) {
    console.error('❌ Erreur de connexion à MySQL:', error.message);
    process.exit(1);
  }
};

// Création de la base de données si elle n'existe pas
const initDatabase = async () => {
  try {
    const connection = mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    const promiseConnection = connection.promise();

    // Créer la base de données
    await promiseConnection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'sntp_db'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Base de données '${process.env.DB_NAME || 'sntp_db'}' créée ou déjà existante`);
    
    await promiseConnection.end();
  } catch (error) {
    console.error('❌ Erreur lors de la création de la base de données:', error.message);
    throw error;
  }
};

// Création de la table appels_offres
const createTables = async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS appels_offres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_ao VARCHAR(100) NOT NULL UNIQUE,
        titre VARCHAR(255) NOT NULL,
        description TEXT,
        type_marche ENUM('Travaux', 'Fournitures', 'Services', 'Etudes') NOT NULL,
        montant_estimatif DECIMAL(15, 2),
        date_publication DATE NOT NULL,
        date_limite_depot DATETIME NOT NULL,
        date_ouverture_plis DATETIME,
        statut ENUM('Ouvert', 'Fermé', 'Annulé', 'Attribué') DEFAULT 'Ouvert',
        localisation VARCHAR(255),
        maitre_ouvrage VARCHAR(255),
        delai_execution INT COMMENT 'Délai en jours',
        cautionnement_provisoire DECIMAL(15, 2),
        documents_requis TEXT COMMENT 'Liste des documents séparés par des virgules',
        contact_email VARCHAR(255),
        contact_telephone VARCHAR(50),
        fichier_cahier_charges VARCHAR(500) COMMENT 'URL ou chemin du fichier',
        conditions_participation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_statut (statut),
        INDEX idx_date_limite (date_limite_depot),
        INDEX idx_type_marche (type_marche),
        INDEX idx_date_publication (date_publication)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await promisePool.query(createTableQuery);
    console.log('✅ Table appels_offres créée ou déjà existante');
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error.message);
    throw error;
  }
};

// Insertion de données de test
const insertSampleData = async () => {
  try {
    const checkQuery = 'SELECT COUNT(*) as count FROM appels_offres';
    const [rows] = await promisePool.query(checkQuery);
    
    if (rows[0].count > 0) {
      console.log('ℹ️  Des données existent déjà dans la table appels_offres');
      return;
    }

    const sampleData = [
      {
        numero_ao: 'AO-2025-001',
        titre: 'Construction d\'un pont autoroutier',
        description: 'Réalisation d\'un pont autoroutier de 250m de longueur reliant les deux rives de l\'autoroute est-ouest',
        type_marche: 'Travaux',
        montant_estimatif: 45000000.00,
        date_publication: '2025-01-15',
        date_limite_depot: '2025-02-28 16:00:00',
        date_ouverture_plis: '2025-03-01 10:00:00',
        statut: 'Ouvert',
        localisation: 'Alger, Algérie',
        maitre_ouvrage: 'SNTP - Société Nationale des Travaux Publics',
        delai_execution: 365,
        cautionnement_provisoire: 900000.00,
        documents_requis: 'Extrait du registre de commerce,Certificat de qualification,Attestation fiscale,Attestation CNAS/CASNOS,Bilan financier 3 dernières années',
        contact_email: 'appelsoffres@sntp.dz',
        contact_telephone: '+213 23 XX XX XX',
        fichier_cahier_charges: '/documents/ao-2025-001-cahier-charges.pdf',
        conditions_participation: 'Entreprise de catégorie 1 ou 2 en travaux d\'art avec un chiffre d\'affaires minimum de 100 millions DA'
      },
      {
        numero_ao: 'AO-2025-002',
        titre: 'Réhabilitation de la route nationale RN01',
        description: 'Travaux de réhabilitation et d\'élargissement de la RN01 sur un tronçon de 45 km',
        type_marche: 'Travaux',
        montant_estimatif: 28000000.00,
        date_publication: '2025-01-20',
        date_limite_depot: '2025-03-10 16:00:00',
        date_ouverture_plis: '2025-03-11 09:00:00',
        statut: 'Ouvert',
        localisation: 'Oran, Algérie',
        maitre_ouvrage: 'SNTP - Société Nationale des Travaux Publics',
        delai_execution: 270,
        cautionnement_provisoire: 560000.00,
        documents_requis: 'Extrait du registre de commerce,Certificat de qualification,Attestation fiscale,Références similaires',
        contact_email: 'appelsoffres@sntp.dz',
        contact_telephone: '+213 41 XX XX XX',
        fichier_cahier_charges: '/documents/ao-2025-002-cahier-charges.pdf',
        conditions_participation: 'Entreprise spécialisée en travaux routiers avec expérience minimale de 5 ans'
      },
      {
        numero_ao: 'AO-2025-003',
        titre: 'Fourniture d\'équipements de chantier',
        description: 'Acquisition de matériel de chantier incluant pelleteuses, bulldozers et camions bennes',
        type_marche: 'Fournitures',
        montant_estimatif: 15000000.00,
        date_publication: '2025-01-25',
        date_limite_depot: '2025-02-20 16:00:00',
        date_ouverture_plis: '2025-02-21 10:00:00',
        statut: 'Ouvert',
        localisation: 'Constantine, Algérie',
        maitre_ouvrage: 'SNTP - Société Nationale des Travaux Publics',
        delai_execution: 90,
        cautionnement_provisoire: 300000.00,
        documents_requis: 'Extrait du registre de commerce,Catalogue produits,Certificat de conformité,Garantie constructeur',
        contact_email: 'achats@sntp.dz',
        contact_telephone: '+213 31 XX XX XX',
        fichier_cahier_charges: '/documents/ao-2025-003-cahier-charges.pdf',
        conditions_participation: 'Fournisseur agréé avec représentation locale et service après-vente'
      },
      {
        numero_ao: 'AO-2025-004',
        titre: 'Étude technique d\'un échangeur autoroutier',
        description: 'Réalisation d\'une étude complète de faisabilité et conception d\'un échangeur autoroutier à 3 niveaux',
        type_marche: 'Etudes',
        montant_estimatif: 5500000.00,
        date_publication: '2025-02-01',
        date_limite_depot: '2025-03-15 16:00:00',
        date_ouverture_plis: '2025-03-16 10:00:00',
        statut: 'Ouvert',
        localisation: 'Annaba, Algérie',
        maitre_ouvrage: 'SNTP - Société Nationale des Travaux Publics',
        delai_execution: 180,
        cautionnement_provisoire: 110000.00,
        documents_requis: 'Extrait du registre de commerce,CV ingénieurs,Références projets similaires,Moyens techniques',
        contact_email: 'etudes@sntp.dz',
        contact_telephone: '+213 38 XX XX XX',
        fichier_cahier_charges: '/documents/ao-2025-004-cahier-charges.pdf',
        conditions_participation: 'Bureau d\'études agréé avec ingénieurs diplômés en génie civil et circulation'
      },
      {
        numero_ao: 'AO-2025-005',
        titre: 'Maintenance des équipements de laboratoire',
        description: 'Contrat de maintenance préventive et curative des équipements de contrôle qualité du laboratoire central',
        type_marche: 'Services',
        montant_estimatif: 3200000.00,
        date_publication: '2025-02-05',
        date_limite_depot: '2025-03-05 16:00:00',
        date_ouverture_plis: '2025-03-06 09:00:00',
        statut: 'Ouvert',
        localisation: 'Alger, Algérie',
        maitre_ouvrage: 'SNTP - Société Nationale des Travaux Publics',
        delai_execution: 365,
        cautionnement_provisoire: 64000.00,
        documents_requis: 'Extrait du registre de commerce,Agrément technique,Attestations de maintenance,Liste techniciens qualifiés',
        contact_email: 'maintenance@sntp.dz',
        contact_telephone: '+213 23 XX XX XX',
        fichier_cahier_charges: '/documents/ao-2025-005-cahier-charges.pdf',
        conditions_participation: 'Entreprise spécialisée en maintenance d\'équipements de laboratoire avec techniciens certifiés'
      },
      {
        numero_ao: 'AO-2024-078',
        titre: 'Construction de tunnels ferroviaires',
        description: 'Réalisation de deux tunnels ferroviaires de 2,5 km chacun pour la ligne de chemin de fer',
        type_marche: 'Travaux',
        montant_estimatif: 125000000.00,
        date_publication: '2024-11-10',
        date_limite_depot: '2024-12-20 16:00:00',
        date_ouverture_plis: '2024-12-21 10:00:00',
        statut: 'Fermé',
        localisation: 'Tizi Ouzou, Algérie',
        maitre_ouvrage: 'SNTP - Société Nationale des Travaux Publics',
        delai_execution: 730,
        cautionnement_provisoire: 2500000.00,
        documents_requis: 'Extrait du registre de commerce,Certificat de qualification catégorie 1,Attestation fiscale,Références tunnels',
        contact_email: 'appelsoffres@sntp.dz',
        contact_telephone: '+213 26 XX XX XX',
        fichier_cahier_charges: '/documents/ao-2024-078-cahier-charges.pdf',
        conditions_participation: 'Entreprise nationale ou groupement avec expérience tunnels minimum 3 ans'
      }
    ];

    for (const data of sampleData) {
      const insertQuery = `
        INSERT INTO appels_offres (
          numero_ao, titre, description, type_marche, montant_estimatif,
          date_publication, date_limite_depot, date_ouverture_plis, statut,
          localisation, maitre_ouvrage, delai_execution, cautionnement_provisoire,
          documents_requis, contact_email, contact_telephone, fichier_cahier_charges,
          conditions_participation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await promisePool.query(insertQuery, [
        data.numero_ao, data.titre, data.description, data.type_marche,
        data.montant_estimatif, data.date_publication, data.date_limite_depot,
        data.date_ouverture_plis, data.statut, data.localisation, data.maitre_ouvrage,
        data.delai_execution, data.cautionnement_provisoire, data.documents_requis,
        data.contact_email, data.contact_telephone, data.fichier_cahier_charges,
        data.conditions_participation
      ]);
    }

    console.log('✅ Données d\'exemple insérées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données:', error.message);
  }
};

module.exports = {
  pool: promisePool,
  testConnection,
  initDatabase,
  createTables,
  insertSampleData
};

