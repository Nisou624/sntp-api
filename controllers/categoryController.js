// controllers/categoryController.js
const Category = require('../models/Category');
const { generateSlug } = require('../utils/slugify');

/**
 * Récupérer toutes les catégories
 */
exports.getAllCategories = async (req, res) => {
  try {
    const { actif, search, page = 1, limit = 50 } = req.query;

    const filters = {
      actif: actif !== undefined ? actif === 'true' : undefined,
      search: search || null,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };

    const categories = await Category.getAll(filters);
    const total = await Category.count(filters);

    res.json({
      success: true,
      data: categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur getAllCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories'
    });
  }
};

/**
 * Récupérer une catégorie par ID
 */
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.getById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Erreur getCategoryById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la catégorie'
    });
  }
};

/**
 * Créer une nouvelle catégorie
 */
exports.createCategory = async (req, res) => {
  try {
    const { nom, description, ordre, actif } = req.body;

    if (!nom) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la catégorie est requis'
      });
    }

    // Générer le slug
    const slug = generateSlug(nom);

    // Vérifier l'unicité du slug
    const existing = await Category.getBySlug(slug);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Une catégorie avec ce nom existe déjà'
      });
    }

    const categoryData = {
      nom,
      description,
      slug,
      ordre: parseInt(ordre) || 0,
      actif: actif !== undefined ? actif === 'true' : true
    };

    // Traiter la photo si présente
    const photoBuffer = req.file || null;

    const newCategory = await Category.create(categoryData, photoBuffer);

    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      data: newCategory
    });
  } catch (error) {
    console.error('Erreur createCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la catégorie'
    });
  }
};

/**
 * Mettre à jour une catégorie
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description, ordre, actif } = req.body;

    // Vérifier que la catégorie existe
    const existing = await Category.getById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    if (!nom) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la catégorie est requis'
      });
    }

    // Générer le slug
    const slug = generateSlug(nom);

    // Vérifier l'unicité du slug (sauf pour la catégorie actuelle)
    const duplicateSlug = await Category.getBySlug(slug);
    if (duplicateSlug && duplicateSlug.id !== parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Une autre catégorie avec ce nom existe déjà'
      });
    }

    const categoryData = {
      nom,
      description,
      slug,
      ordre: parseInt(ordre) || 0,
      actif: actif !== undefined ? actif === 'true' : true
    };

    // Traiter la nouvelle photo si présente
    const photoBuffer = req.file || null;

    const updatedCategory = await Category.update(id, categoryData, photoBuffer);

    res.json({
      success: true, message: 'Catégorie mise à jour avec succès',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Erreur updateCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la catégorie'
    });
  }
};

/**
 * Supprimer une catégorie
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.getById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    await Category.delete(id);

    res.json({
      success: true,
      message: 'Catégorie supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteCategory:', error);
    
    // Erreur de contrainte de clé étrangère
    if (error.message.includes('projet')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la catégorie'
    });
  }
};

/**
 * Récupérer l'image d'une catégorie
 * ⚠️ NOUVELLE MÉTHODE À AJOUTER
 */
exports.getCategoryImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { QueryTypes } = require('sequelize');
    const { sequelize } = require('../config/db');
    
    console.log(`📷 Récupération image catégorie ID: ${id}`);
    
    const query = 'SELECT photo, photo_mime_type, photo_name FROM categories WHERE id = ?';
    const categories = await sequelize.query(query, {
      replacements: [id],
      type: QueryTypes.SELECT
    });
    
    if (!categories || categories.length === 0) {
      console.log(`❌ Catégorie ${id} non trouvée`);
      return res.status(404).json({ 
        success: false, 
        message: 'Catégorie non trouvée' 
      });
    }
    
    const category = categories[0];
    
    if (!category.photo || category.photo.length === 0) {
      console.log(`❌ Pas de photo pour catégorie ${id}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Aucune image disponible pour cette catégorie' 
      });
    }
    
    console.log(`✅ Image trouvée (${category.photo.length} bytes)`);
    
    // Headers pour l'image
    res.setHeader('Content-Type', category.photomimetype || 'image/jpeg');
    res.setHeader('Content-Length', category.photo.length);
    res.setHeader('Content-Disposition', `inline; filename="${category.photoname || `category-${id}.jpg`}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Envoyer l'image
    res.send(category.photo);
  } catch (error) {
    console.error('❌ Erreur getCategoryImage:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du téléchargement de l\'image',
      error: error.message 
    });
  }
};
