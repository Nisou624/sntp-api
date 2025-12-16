-- ============================================
-- Script de création et remplissage de la table appels_offres (MySQL/MariaDB)
-- Date: 2025-12-16
-- Description: Création de la table des appels d'offres et insertion des données initiales
-- ============================================

-- Supprimer la table si elle existe déjà
DROP TABLE IF EXISTS appels_offres;

-- Création de la table appels_offres
CREATE TABLE appels_offres (
    id VARCHAR(50) PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date_publication DATETIME NOT NULL,
    date_echeance DATETIME NOT NULL,
    reference VARCHAR(50) NOT NULL UNIQUE,
    montant BIGINT NOT NULL,
    localisation VARCHAR(100) NOT NULL,
    statut ENUM('actif', 'annule', 'cloture') NOT NULL DEFAULT 'actif',
    pdf_path VARCHAR(255) NULL,
    pdf_original_name VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_statut (statut),
    INDEX idx_date_publication (date_publication),
    INDEX idx_date_echeance (date_echeance),
    INDEX idx_reference (reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion des données

INSERT INTO appels_offres (
    id, titre, description, date_publication, date_echeance, 
    reference, montant, localisation, statut, pdf_path, 
    pdf_original_name, created_at, updated_at
) VALUES (
    '1765789301053',
    'kda',
    'apoezirazlekmrjazoei',
    '2025-12-15 00:00:00',
    '2026-02-27 00:00:00',
    '26-001',
    123456789,
    'ALGER',
    'actif',
    '/uploads/appels-offres/couverture-1765789301047-397989162.pdf',
    'couverture.pdf',
    '2025-12-15 09:01:41.053',
    '2025-12-15 09:01:41.053'
);

INSERT INTO appels_offres (
    id, titre, description, date_publication, date_echeance, 
    reference, montant, localisation, statut, pdf_path, 
    pdf_original_name, created_at, updated_at
) VALUES (
    '1',
    'Construction d''un pont autoroutier',
    'Construction d''un pont autoroutier de 500 mètres reliant Alger à Tipaza',
    '2024-01-15 00:00:00',
    '2024-04-15 00:00:00',
    'AO-2024-001',
    150000000,
    'Alger - Tipaza',
    'actif',
    NULL,
    NULL,
    '2025-12-15 10:05:12.880',
    '2025-12-15 10:05:12.880'
);

INSERT INTO appels_offres (
    id, titre, description, date_publication, date_echeance, 
    reference, montant, localisation, statut, pdf_path, 
    pdf_original_name, created_at, updated_at
) VALUES (
    '2',
    'Rénovation du réseau d''assainissement',
    'Travaux de rénovation et modernisation du réseau d''assainissement de la ville de Constantine',
    '2024-02-15 00:00:00',
    '2024-05-15 00:00:00',
    'AO-2024-002',
    85000000,
    'Constantine',
    'actif',
    NULL,
    NULL,
    '2025-12-15 10:05:12.880',
    '2025-12-15 10:05:12.880'
);

INSERT INTO appels_offres (
    id, titre, description, date_publication, date_echeance, 
    reference, montant, localisation, statut, pdf_path, 
    pdf_original_name, created_at, updated_at
) VALUES (
    '3',
    'Aménagement d''une zone industrielle',
    'Aménagement et viabilisation d''une zone industrielle de 50 hectares',
    '2024-03-01 10:00:00',
    '2024-06-01 23:59:59',
    'AO-2024-003',
    200000000,
    'Oran',
    'actif',
    NULL,
    NULL,
    '2025-12-15 10:05:12.881',
    '2025-12-15 10:05:12.881'
);

INSERT INTO appels_offres (
    id, titre, description, date_publication, date_echeance, 
    reference, montant, localisation, statut, pdf_path, 
    pdf_original_name, created_at, updated_at
) VALUES (
    '4',
    'Construction de logements sociaux',
    'Construction de 500 logements sociaux avec équipements collectifs',
    '2024-02-20 08:00:00',
    '2024-08-20 18:00:00',
    'AO-2024-004',
    250000000,
    'Sétif',
    'actif',
    NULL,
    NULL,
    '2025-12-15 10:05:12.881',
    '2025-12-15 10:05:12.881'
);

INSERT INTO appels_offres (
    id, titre, description, date_publication, date_echeance, 
    reference, montant, localisation, statut, pdf_path, 
    pdf_original_name, created_at, updated_at
) VALUES (
    '5',
    'Réhabilitation d''un barrage',
    'Travaux de réhabilitation et mise aux normes du barrage de Taksebt',
    '2024-01-10 00:00:00',
    '2024-07-10 00:00:00',
    'AO-2024-005',
    120000000,
    'Tizi Ouzou',
    'actif',
    NULL,
    NULL,
    '2025-12-15 10:05:12.881',
    '2025-12-15 10:05:12.881'
);

INSERT INTO appels_offres (
    id, titre, description, date_publication, date_echeance, 
    reference, montant, localisation, statut, pdf_path, 
    pdf_original_name, created_at, updated_at
) VALUES (
    '6',
    'Extension du réseau de tramway',
    'Extension de la ligne de tramway sur 15 km avec 20 stations',
    '2024-03-15 00:00:00',
    '2024-09-15 00:00:00',
    'AO-2024-006',
    300000000,
    'Annaba',
    'actif',
    NULL,
    NULL,
    '2025-12-15 10:05:12.881',
    '2025-12-15 10:05:12.881'
);

INSERT INTO appels_offres (
    id, titre, description, date_publication, date_echeance, 
    reference, montant, localisation, statut, pdf_path, 
    pdf_original_name, created_at, updated_at
) VALUES (
    '7',
    'Modernisation d''un hôpital universitaire',
    'Modernisation et extension du CHU avec nouveaux équipements médicaux',
    '2024-02-01 00:00:00',
    '2024-12-01 00:00:00',
    'AO-2024-007',
    180000000,
    'Batna',
    'actif',
    NULL,
    NULL,
    '2025-12-15 10:05:12.881',
    '2025-12-15 10:05:12.881'
);

INSERT INTO appels_offres (
    id, titre, description, date_publication, date_echeance, 
    reference, montant, localisation, statut, pdf_path, 
    pdf_original_name, created_at, updated_at
) VALUES (
    '8',
    'Construction d''un complexe sportif',
    'Construction d''un complexe sportif olympique avec stade de 40000 places',
    '2024-04-01 00:00:00',
    '2025-04-01 00:00:00',
    'AO-2024-008',
    400000000,
    'Blida',
    'actif',
    NULL,
    NULL,
    '2025-12-15 10:05:12.881',
    '2025-12-15 10:05:12.881'
);

INSERT INTO appels_offres (
    id, titre, description, date_publication, date_echeance, 
    reference, montant, localisation, statut, pdf_path, 
    pdf_original_name, created_at, updated_at
) VALUES (
    '1765793605028',
    'test',
    'test',
    '2025-12-15 00:00:00',
    '2025-12-25 00:00:00',
    '123',
    987654321,
    'Boumerdes',
    'annule',
    '/uploads/appels-offres/liste_entreprises_it_algerie-1765793605022-980716313.pdf',
    'liste_entreprises_it_algerie.pdf',
    '2025-12-15 10:13:25.028',
    '2025-12-15 10:13:25.028'
);

-- Vérification de l'insertion
SELECT COUNT(*) as total_records FROM appels_offres;

-- Afficher les 5 premiers enregistrements
SELECT id, titre, reference, statut, localisation 
FROM appels_offres 
ORDER BY date_publication DESC 
LIMIT 5;

-- Afficher les statistiques par statut
SELECT statut, COUNT(*) as nombre 
FROM appels_offres 
GROUP BY statut;
