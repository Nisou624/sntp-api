const AppelOffre = require('../models/AppelOffre');

// Récupérer tous les appels d'offres
exports.getAllAppelsOffres = async (req, res) => {
  try {
    const filters = {
      statut: req.query.statut,
      type_marche: req.query.type_marche,
      localisation: req.query.localisation,
      search: req.query.search,
      orderBy: req.query.orderBy,
      order: req.query.order,
      limit: req.query.limit,
      offset: req.query.offset
    };

    const appelsOffres = await AppelOffre.getAll(filters);
    
    res.status(200).json({
      success: true,
      count: appelsOffres.length,
      data: appelsOffres
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Récupérer un appel d'offre par ID
exports.getAppelOffreById = async (req, res) => {
  try {
    const { id } = req.params;
    const appelOffre = await AppelOffre.getById(id);

    if (!appelOffre) {
      return res.status(404).json({
        success: false,
        message: 'Appel d\'offre non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: appelOffre
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Récupérer un appel d'offre par numéro
exports.getAppelOffreByNumero = async (req, res) => {
  try {
    const { numero } = req.params;
    const appelOffre = await AppelOffre.getByNumero(numero);

    if (!appelOffre) {
      return res.status(404).json({
        success: false,
        message: 'Appel d\'offre non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: appelOffre
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Créer un nouvel appel d'offre
exports.createAppelOffre = async (req, res) => {
  try {
    const appelOffre = await AppelOffre.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Appel d\'offre créé avec succès',
      data: appelOffre
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Mettre à jour un appel d'offre
exports.updateAppelOffre = async (req, res) => {
  try {
    const { id } = req.params;
    const appelOffre = await AppelOffre.update(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Appel d\'offre mis à jour avec succès',
      data: appelOffre
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Supprimer un appel d'offre
exports.deleteAppelOffre = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AppelOffre.delete(id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Obtenir les statistiques
exports.getStatistics = async (req, res) => {
  try {
    const statistics = await AppelOffre.getStatistics();

    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//Obtenir les details
exports.getAppelOffreById= async (req, res) => {
  try {
    const { id } = req.params;
    const appelOffre = await AppelOffre.getById(id);
    
    if (!appelOffre) {
      return res.status(404).json({
        success: false,
        message: 'Appel d\'offre non trouvé'
      });
    }
    
    res.json(appelOffre);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
