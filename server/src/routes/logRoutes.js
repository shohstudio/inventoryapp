const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/logController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getLogs);

module.exports = router;
