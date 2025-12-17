// controllers/articleController.js
const Article = require('../models/Article');
const { Op } = require('sequelize');

// Fonction utilitaire pour parser les tags
const parseArticleTags = (article) => {
  if (article && article.tags) {
    // Si tags est une chaîne, le parser en JSON
    if (typeof article.tags === 'string') {
      try {
        article.tags = JSON.parse(article.tags);
      } catch (error) {
        console.error('Erreur parsing tags:', error);
        article.tags = [];
      }
    }
    // Si tags n'est pas un tableau, le convertir en tableau vide
    if (!Array.isArray(article.tags)) {
      article.tags = [];
    }
  } else {
    article.tags = [];
  }
  return article;
};

// Récupérer tous les articles avec filtres et pagination
exports.getAllArticles = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      statut, 
      search, 
      sortBy = 'datePublication', 
      sortOrder = 'DESC' 
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (statut) {
      where.statut = statut;
    }

    if (search) {
      where[Op.or] = [
        { titre: { [Op.like]: `%${search}%` } },
        { contenu: { [Op.like]: `%${search}%` } },
        { extrait: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Article.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    // Parser les tags pour chaque article
    const articlesWithParsedTags = rows.map(article => {
      const articleData = article.toJSON();
      return parseArticleTags(articleData);
    });

    res.json({
      success: true,
      data: articlesWithParsedTags,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des articles',
      error: error.message
    });
  }
};

// Récupérer un article par ID
exports.getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findByPk(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Parser les tags
    const articleData = article.toJSON();
    const parsedArticle = parseArticleTags(articleData);

    res.json({
      success: true,
      data: parsedArticle
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'article',
      error: error.message
    });
  }
};

// Récupérer un article par slug
exports.getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const article = await Article.findOne({
      where: { slug }
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Parser les tags
    const articleData = article.toJSON();
    const parsedArticle = parseArticleTags(articleData);

    res.json({
      success: true,
      data: parsedArticle
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'article',
      error: error.message
    });
  }
};

// Créer un nouvel article
exports.createArticle = async (req, res) => {
  try {
    const { 
      titre, 
      slug, 
      contenu, 
      extrait, 
      auteur, 
      imagePrincipale, 
      statut, 
      datePublication, 
      tags,
      metaDescription
    } = req.body;

    // Vérifier que le slug est unique
    const existingArticle = await Article.findOne({ where: { slug } });
    if (existingArticle) {
      return res.status(400).json({
        success: false,
        message: 'Ce slug existe déjà'
      });
    }

    // Convertir tags en JSON string si c'est un tableau
    const tagsToSave = Array.isArray(tags) ? JSON.stringify(tags) : tags;

    const article = await Article.create({
      titre,
      slug,
      contenu,
      extrait,
      auteur,
      imagePrincipale,
      statut: statut || 'brouillon',
      datePublication: datePublication || null,
      tags: tagsToSave,
      metaDescription
    });

    // Parser les tags avant de renvoyer
    const articleData = article.toJSON();
    const parsedArticle = parseArticleTags(articleData);

    res.status(201).json({
      success: true,
      message: 'Article créé avec succès',
      data: parsedArticle
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'article:', error);
    
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

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'article',
      error: error.message
    });
  }
};

// Mettre à jour un article
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      titre, 
      slug, 
      contenu, 
      extrait, 
      auteur, 
      imagePrincipale, 
      statut, 
      datePublication, 
      tags,
      metaDescription
    } = req.body;

    const article = await Article.findByPk(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Vérifier que le slug est unique (sauf pour l'article actuel)
    if (slug && slug !== article.slug) {
      const existingArticle = await Article.findOne({ where: { slug } });
      if (existingArticle) {
        return res.status(400).json({
          success: false,
          message: 'Ce slug existe déjà'
        });
      }
    }

    // Convertir tags en JSON string si c'est un tableau
    const tagsToSave = Array.isArray(tags) ? JSON.stringify(tags) : tags;

    await article.update({
      titre: titre || article.titre,
      slug: slug || article.slug,
      contenu: contenu || article.contenu,
      extrait: extrait !== undefined ? extrait : article.extrait,
      auteur: auteur !== undefined ? auteur : article.auteur,
      imagePrincipale: imagePrincipale !== undefined ? imagePrincipale : article.imagePrincipale,
      statut: statut || article.statut,
      datePublication: datePublication !== undefined ? datePublication : article.datePublication,
      tags: tagsToSave !== undefined ? tagsToSave : article.tags,
      metaDescription: metaDescription !== undefined ? metaDescription : article.metaDescription
    });

    // Parser les tags avant de renvoyer
    const articleData = article.toJSON();
    const parsedArticle = parseArticleTags(articleData);

    res.json({
      success: true,
      message: 'Article mis à jour avec succès',
      data: parsedArticle
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'article:', error);
    
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

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'article',
      error: error.message
    });
  }
};

// Supprimer un article
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findByPk(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    await article.destroy();

    res.json({
      success: true,
      message: 'Article supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'article:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'article',
      error: error.message
    });
  }
};

// Obtenir les statistiques
exports.getStatistics = async (req, res) => {
  try {
    const statistics = await Article.getStatistics();

    res.json({
      success: true,
      data: statistics
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

