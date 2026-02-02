const express = require('express');
const router = express.Router();
const { getUsers, getUserById, createUser, updateUser, deleteUser, checkAvailability, updateProfile } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/check-availability', protect, admin, checkAvailability);
router.put('/profile', protect, upload.single('image'), updateProfile);

router.route('/')
    .get(protect, (req, res, next) => {
        if (req.user.role === 'admin' || req.user.role === 'accounter') {
            next();
        } else {
            res.status(403);
            throw new Error('Not authorized as admin or accounter');
        }
    }, getUsers)
    .post(protect, admin, upload.single('image'), createUser);

router.route('/:id')
    .get(protect, getUserById)
    .put(protect, admin, upload.single('image'), updateUser)
    .delete(protect, admin, deleteUser);

module.exports = router;
