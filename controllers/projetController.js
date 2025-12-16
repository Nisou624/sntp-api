// controllers/projetController.js
const Projet = require('../models/Projet');
const { Op } = require('sequelize');

// Récupérer tous les projets
exports.getAllProjets = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 10, sortBy = 'year', sortOrder = 'DESC' } = req.query;
    
    // Construire les conditions de recherche
    const where = {};
    
    if (category) {
      where.category = category;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where[Op.or] = [
        { titre: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Pagination
    const offset = (page - 1) * limit;
    
    // Récupérer les données
    const { count, rows } = await Projet.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      raw: false
    });
    
    res.status(200).json({
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Récupérer un projet par ID
exports.getProjetById = async (req, res) => {
  try {
    const { id } = req.params;
    const projet = await Projet.findByPk(id);
    
    if (!projet) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }
    
    res.status(200).json({
      success: true,
      data: projet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Créer un nouveau projet
exports.createProjet = async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Préparer les données du projet
    const projetData = {
      titre: req.body.titre,
      category: req.body.category,
      image: req.body.image,
      location: req.body.location,
      year: req.body.year,
      status: req.body.status || 'in_progress',
      description: req.body.description,
      latitude: req.body.latitude || null,
      longitude: req.body.longitude || null
    };
    
    // Créer le projet
    const newProjet = await Projet.create(projetData);
    
    res.status(201).json({
      success: true,
      message: 'Projet créé avec succès',
      data: newProjet
    });
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error);
    
    // Gérer les erreurs de validation Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du projet',
      error: error.message
    });
  }
};

// Mettre à jour un projet
exports.updateProjet = async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Vérifier si le projet existe
    const projet = await Projet.findByPk(req.params.id);
    
    if (!projet) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }
    
    // Préparer les données de mise à jour
    const updateData = { ...req.body };
    
    // Mettre à jour le projet
    await projet.update(updateData);
    
    // Recharger pour obtenir les données à jour
    await projet.reload();
    
    res.json({
      success: true,
      message: 'Projet mis à jour avec succès',
      data: projet
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du projet:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du projet',
      error: error.message
    });
  }
};

// Supprimer un projet
exports.deleteProjet = async (req, res) => {
  try {
    const projet = await Projet.findByPk(req.params.id);
    
    if (!projet) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }
    
    // Supprimer l'enregistrement
    await projet.destroy();
    
    res.json({
      success: true,
      message: 'Projet supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du projet',
      error: error.message
    });
  }
};

// Obtenir les statistiques
exports.getStatistics = async (req, res) => {
  try {
    const stats = await Projet.getStatistics();
    
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
};

