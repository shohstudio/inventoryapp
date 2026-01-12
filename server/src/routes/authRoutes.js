const express = require('express');
const router = express.Router();
const { login, registerSetup } = require('../controllers/authController');

router.post('/login', login);
// This route is temporary for creating initial admin/users
router.post('/register-setup', registerSetup);

module.exports = router;
