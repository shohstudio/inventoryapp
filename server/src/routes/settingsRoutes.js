const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, settingsController.getSettings);
router.post('/inventory-dates', protect, adminOnly, settingsController.updateInventoryDates);

module.exports = router;
