// routes/categories.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const multer = require('multer');

// Configuration de Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

// Routes publiques (GET)
router.get('/', categoryController.getAllCategories);

// ⚠️ IMPORTANT: Route image AVANT route :id
router.get('/:id/image', categoryController.getCategoryImage);
router.get('/:id', categoryController.getCategoryById);

// Routes protégées (POST, PUT, DELETE)
router.post('/', upload.single('photo'), categoryController.createCategory);
router.put('/:id', upload.single('photo'), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;

