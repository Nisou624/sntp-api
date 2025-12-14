const express = require('express');
const router = express.Router();
const appelOffreController = require('../controllers/appelOffreController');

// Routes pour les appels d'offres
router.get('/', appelOffreController.getAllAppelsOffres);
router.get('/statistics', appelOffreController.getStatistics);
router.get('/:id', appelOffreController.getAppelOffreById);
router.get('/numero/:numero', appelOffreController.getAppelOffreByNumero);
router.post('/', appelOffreController.createAppelOffre);
router.put('/:id', appelOffreController.updateAppelOffre);
router.delete('/:id', appelOffreController.deleteAppelOffre);

module.exports = router;

