const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, settingsController.getSettings);
router.post('/inventory-dates', protect, admin, settingsController.updateInventoryDates);

module.exports = router;
