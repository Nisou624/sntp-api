const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/auth');
const upload = require('../config/multer');
const AppelOffre = require('../models/AppelOffre');
const fs = require('fs');
const path = require('path');

// GET - Obtenir tous les appels d'offres (public)
router.get('/', async (req, res) => {
  try {
    const { 
      statut, 
      localisation, 
      search, 
      page = 1, 
      limit = 10,
      sortBy = 'datePublication',
      sortOrder = 'DESC'
    } = req.query;

    // Construire les conditions de recherche
    const where = {};
    
    if (statut) {
      where.statut = statut;
    }
    
    if (localisation) {
      where.localisation = {
        [Op.like]: `%${localisation}%`
      };
    }
    
    if (search) {
      where[Op.or] = [
        { titre: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { reference: { [Op.like]: `%${search}%` } }
      ];
    }

    // Pagination
    const offset = (page - 1) * limit;

    // Récupérer les données
    const { count, rows } = await AppelOffre.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      raw: false
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des appels d\'offres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des appels d\'offres',
      error: error.message
    });
  }
});

// GET - Obtenir un appel d'offre par ID (public)
router.get('/:id', async (req, res) => {
  try {
    const appelOffre = await AppelOffre.findByPk(req.params.id);
    
    if (!appelOffre) {
      return res.status(404).json({
        success: false,
        message: 'Appel d\'offre non trouvé'
      });
    }

    res.json({
      success: true,
      data: appelOffre
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'appel d\'offre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'appel d\'offre',
      error: error.message
    });
  }
});

// POST - Créer un nouvel appel d'offre (protégé)
router.post('/', authMiddleware, upload.single('pdf'), [
  body('titre').trim().notEmpty().withMessage('Le titre est requis'),
  body('description').trim().notEmpty().withMessage('La description est requise'),
  body('datePublication').isISO8601().withMessage('Date de publication invalide'),
  body('dateEcheance').isISO8601().withMessage('Date d\'échéance invalide'),
  body('reference').trim().notEmpty().withMessage('La référence est requise'),
  body('montant').optional().isNumeric().withMessage('Le montant doit être un nombre'),
  body('localisation').trim().notEmpty().withMessage('La localisation est requise'),
  body('statut').optional().isIn(['actif', 'expire', 'annule']).withMessage('Statut invalide')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Supprimer le fichier uploadé si erreur de validation
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Vérifier que la référence n'existe pas déjà
    const existingRef = await AppelOffre.findOne({
      where: { reference: req.body.reference }
    });

    if (existingRef) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Cette référence existe déjà'
      });
    }

    // Préparer les données
    const appelOffreData = {
      titre: req.body.titre,
      description: req.body.description,
      datePublication: req.body.datePublication,
      dateEcheance: req.body.dateEcheance,
      reference: req.body.reference,
      montant: req.body.montant || null,
      localisation: req.body.localisation,
      statut: req.body.statut || 'actif',
      pdfPath: req.file ? `/uploads/appels-offres/${req.file.filename}` : null,
      pdfOriginalName: req.file ? req.file.originalname : null
    };

    // Créer l'appel d'offre
    const newAppelOffre = await AppelOffre.create(appelOffreData);

    res.status(201).json({
      success: true,
      message: 'Appel d\'offre créé avec succès',
      data: newAppelOffre
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'appel d\'offre:', error);
    
    // Supprimer le fichier uploadé en cas d'erreur
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    // Gérer les erreurs de validation Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Cette référence existe déjà'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'appel d\'offre',
      error: error.message
    });
  }
});

// PUT - Mettre à jour un appel d'offre (protégé)
router.put('/:id', authMiddleware, upload.single('pdf'), [
  body('titre').optional().trim().notEmpty().withMessage('Le titre ne peut pas être vide'),
  body('description').optional().trim().notEmpty().withMessage('La description ne peut pas être vide'),
  body('datePublication').optional().isISO8601().withMessage('Date de publication invalide'),
  body('dateEcheance').optional().isISO8601().withMessage('Date d\'échéance invalide'),
  body('reference').optional().trim().notEmpty().withMessage('La référence ne peut pas être vide'),
  body('montant').optional().isNumeric().withMessage('Le montant doit être un nombre'),
  body('localisation').optional().trim().notEmpty().withMessage('La localisation ne peut pas être vide'),
  body('statut').optional().isIn(['actif', 'expire', 'annule']).withMessage('Statut invalide')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Vérifier si l'appel d'offre existe
    const appelOffre = await AppelOffre.findByPk(req.params.id);
    if (!appelOffre) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Appel d\'offre non trouvé'
      });
    }

    // Préparer les données de mise à jour
    const updateData = { ...req.body };

    // Gérer le nouveau PDF si fourni
    if (req.file) {
      // Supprimer l'ancien PDF
      if (appelOffre.pdfPath) {
        const oldPdfPath = path.join(__dirname, '..', appelOffre.pdfPath);
        if (fs.existsSync(oldPdfPath)) {
          try {
            fs.unlinkSync(oldPdfPath);
          } catch (err) {
            console.error('Erreur lors de la suppression de l\'ancien PDF:', err);
          }
        }
      }

      updateData.pdfPath = `/uploads/appels-offres/${req.file.filename}`;
      updateData.pdfOriginalName = req.file.originalname;
    }

    // Mettre à jour l'appel d'offre
    await appelOffre.update(updateData);

    // Recharger pour obtenir les données à jour
    await appelOffre.reload();

    res.json({
      success: true,
      message: 'Appel d\'offre mis à jour avec succès',
      data: appelOffre
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'appel d\'offre:', error);
    
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Cette référence existe déjà'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'appel d\'offre',
      error: error.message
    });
  }
});

// DELETE - Supprimer un appel d'offre (protégé)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appelOffre = await AppelOffre.findByPk(req.params.id);

    if (!appelOffre) {
      return res.status(404).json({
        success: false,
        message: 'Appel d\'offre non trouvé'
      });
    }

    // Supprimer le fichier PDF associé si il existe
    if (appelOffre.pdfPath) {
      const fullPath = path.join(__dirname, '..', appelOffre.pdfPath);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (err) {
          console.error('Erreur lors de la suppression du PDF:', err);
        }
      }
    }

    // Supprimer l'enregistrement
    await appelOffre.destroy();

    res.json({
      success: true,
      message: 'Appel d\'offre supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'appel d\'offre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'appel d\'offre',
      error: error.message
    });
  }
});

// GET - Obtenir les statistiques (protégé)
router.get('/admin/statistics', authMiddleware, async (req, res) => {
  try {
    const stats = await AppelOffre.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

module.exports = router;

