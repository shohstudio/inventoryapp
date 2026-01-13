const express = require('express');
const router = express.Router();
const { getUsers, getUserById, createUser, updateUser, deleteUser, checkAvailability } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/check-availability', protect, admin, checkAvailability);

router.route('/')
    .get(protect, admin, getUsers)
    .post(protect, admin, createUser);

router.route('/:id')
    .get(protect, getUserById)
    .put(protect, admin, updateUser)
    .delete(protect, admin, deleteUser);

module.exports = router;
