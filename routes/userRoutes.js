const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// All user routes require authentication
router.use(authMiddleware);

// Leaderboard and experts
router.get('/leaderboard', userController.getLeaderboard);
router.get('/experts', userController.getExperts);
router.get('/stats/:id?', userController.getUserStats);
router.get('/departments', userController.getDepartments);
router.get('/regions', userController.getRegions);

module.exports = router;
