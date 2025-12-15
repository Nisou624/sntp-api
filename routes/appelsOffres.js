const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const upload = require('../config/multer');
const AppelOffre = require('../models/AppelOffre');
const fs = require('fs');
const path = require('path');

// GET - Obtenir tous les appels d'offres (public)
router.get('/', (req, res) => {
  try {
    const appelsOffres = AppelOffre.getAll();
    res.json({
      success: true,
      data: appelsOffres
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des appels d\'offres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des appels d\'offres'
    });
  }
});

// GET - Obtenir un appel d'offre par ID (public)
router.get('/:id', (req, res) => {
  try {
    const appelOffre = AppelOffre.getById(req.params.id);
    
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
      message: 'Erreur lors de la récupération de l\'appel d\'offre'
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
  body('localisation').trim().notEmpty().withMessage('La localisation est requise')
], (req, res) => {
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
    const newAppelOffre = AppelOffre.create(appelOffreData);

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

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'appel d\'offre'
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
  body('localisation').optional().trim().notEmpty().withMessage('La localisation ne peut pas être vide')
], (req, res) => {
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
    const existingAppelOffre = AppelOffre.getById(req.params.id);
    if (!existingAppelOffre) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Appel d\'offre non trouvé'
      });
    }

    // Préparer les données de mise à jour
    const updateData = {
      ...req.body
    };

    // Gérer le nouveau PDF si fourni
    if (req.file) {
      // Supprimer l'ancien PDF
      if (existingAppelOffre.pdfPath) {
        const oldPdfPath = path.join(__dirname, '..', existingAppelOffre.pdfPath);
        if (fs.existsSync(oldPdfPath)) {
          fs.unlinkSync(oldPdfPath);
        }
      }

      updateData.pdfPath = `/uploads/appels-offres/${req.file.filename}`;
      updateData.pdfOriginalName = req.file.originalname;
    }

    // Mettre à jour l'appel d'offre
    const updatedAppelOffre = AppelOffre.update(req.params.id, updateData);

    res.json({
      success: true,
      message: 'Appel d\'offre mis à jour avec succès',
      data: updatedAppelOffre
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'appel d\'offre:', error);
    
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'appel d\'offre'
    });
  }
});

// DELETE - Supprimer un appel d'offre (protégé)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const deleted = AppelOffre.delete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Appel d\'offre non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Appel d\'offre supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'appel d\'offre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'appel d\'offre'
    });
  }
});

module.exports = router;

