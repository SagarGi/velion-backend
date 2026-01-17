const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// All document routes require authentication
router.use(authMiddleware);

// Document CRUD operations
router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/', documentController.getDocuments);
router.get('/recent', documentController.getRecentDocuments);
router.get('/pending', documentController.getPendingDocuments);
router.get('/:id', documentController.getDocumentById);
router.get('/:id/download', documentController.downloadDocument);
router.put('/:id/review', documentController.reviewDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
