const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getExternalItems, registerEntry, markExit } = require('../controllers/externalItemController');

router.route('/')
    .get(protect, getExternalItems)
    .post(protect, registerEntry);

router.route('/:id/exit')
    .put(protect, markExit);

module.exports = router;
