const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

// Generate JWT
const generateToken = (id, role, name) => {
    return jwt.sign({ id, role, name }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log('Login attempt:', username, password);
        const user = await prisma.user.findUnique({
            where: { username },
        });

        console.log('User found:', user);

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            console.log('Password match:', isMatch);
        }

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
                pinfl: user.pinfl,
                token: generateToken(user.id, user.role, user.name),
            });
        } else {
            res.status(401).json({ message: 'Login yoki parol noto\'g\'ri' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server xatosi' });
    }
};

// @desc    Register a new user (Usually Admin does this, but for setup)
// @route   POST /api/auth/register-setup
// @access  Public (Should be protected or removed after setup)
const registerSetup = async (req, res) => {
    const { name, username, password, role, pinfl } = req.body;

    try {
        const userExists = await prisma.user.findUnique({
            where: { username },
        });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                name,
                username,
                password: hashedPassword,
                role: role || 'employee',
                pinfl
            },
        });

        if (user) {
            res.status(201).json({
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
                token: generateToken(user.id, user.role, user.name),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server xatosi' });
    }
};

module.exports = { login, registerSetup };
