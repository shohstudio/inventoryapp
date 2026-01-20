const express = require('express');
const router = express.Router();
const { getItems, getItemById, createItem, updateItem, deleteItem, importItems, deleteManyItems, verifyInventoryItem } = require('../controllers/itemController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/import', protect, admin, upload.single('file'), importItems);

router.route('/')
    .get(protect, getItems)
    .post(protect, upload.array('images', 5), createItem);

router.route('/:id')
    .get(protect, getItemById)
    .put(protect, upload.array('images', 5), updateItem)
    .delete(protect, admin, deleteItem);

router.post('/delete-many', protect, admin, deleteManyItems);
router.post('/:id/verify-inventory', protect, upload.array('images', 1), verifyInventoryItem);

module.exports = router;
