const express = require('express');
const router = express.Router();
const { getDashboardStats, getTMJStats } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getDashboardStats);
router.get('/tmj', protect, getTMJStats);

module.exports = router;
