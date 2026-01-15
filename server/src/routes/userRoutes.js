const express = require('express');
const router = express.Router();
const { getUsers, getUserById, createUser, updateUser, deleteUser, checkAvailability } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/check-availability', protect, admin, checkAvailability);

router.route('/')
    .get(protect, (req, res, next) => {
        if (req.user.role === 'admin' || req.user.role === 'accounter') {
            next();
        } else {
            res.status(403);
            throw new Error('Not authorized as admin or accounter');
        }
    }, getUsers)
    .post(protect, admin, createUser);

router.route('/:id')
    .get(protect, getUserById)
    .put(protect, admin, updateUser)
    .delete(protect, admin, deleteUser);

module.exports = router;
