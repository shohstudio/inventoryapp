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
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
                pinfl: user.pinfl,
                image: user.image,
                phone: user.phone,
                position: user.position,
                department: user.department,
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

// Verify PKCS#7 Signature (Placeholder)
/**
 * @CAUTION This is a temporary placeholder.
 * It DOES NOT verify the actual digital signature (PKCS#7).
 * For production, this MUST call an official verification service (e.g., Soliq API).
 */
const verifyPkcs7 = async (signature) => {
    // SECURITY WARNING: In this placeholder state, anyone can login if they know the PINFL.
    // This MUST be replaced with real verification logic before going live.

    if (!signature) return false;

    // Check if we are in development mode
    if (process.env.NODE_ENV === 'production') {
        console.error("CRITICAL SECURITY RISK: E-IMZO placeholder used in production!");
        return false; // Force fail in production unless real logic is added
    }

    return true;
};

// @desc    Login with E-IMZO (Soliq)
// @route   POST /api/auth/eimzo
// @access  Public
const eimzoLogin = async (req, res) => {
    const { signature, pinfl } = req.body;

    try {
        // 1. Verify Signature
        const isValid = await verifyPkcs7(signature);
        if (!isValid) {
            return res.status(401).json({ message: "Imzo haqiqiy emas (Signature Invalid)" });
        }

        // 2. Find User by PINFL
        let user = await prisma.user.findFirst({
            where: { pinfl }
        });

        // 3. If user doesn't exist, Create or Reject?
        // Logic: specific to business. Here we might auto-create LIMITED access users or reject.
        // Let's CREATE a temporary employee if not found, or reject if we want strict access.
        // For ASTI project, usually we want to allow employees to enter.

        if (!user) {
            // Option A: Reject
            // return res.status(404).json({ message: "Foydalanuvchi tizimda topilmadi" });

            // Option B: Auto-create (Employee)
            const randomName = `Xodim ${pinfl.slice(-4)}`;
            user = await prisma.user.create({
                data: {
                    name: randomName,
                    username: `eri_${pinfl}`,
                    password: await bcrypt.hash(Math.random().toString(), 10), // Random password
                    role: 'employee',
                    pinfl: pinfl,
                    image: null,
                    phone: null
                }
            });
        }

        // 4. Generate Token
        res.json({
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            pinfl: user.pinfl,
            image: user.image,
            phone: user.phone,
            position: user.position,
            department: user.department,
            token: generateToken(user.id, user.role, user.name),
        });

    } catch (error) {
        console.error("E-IMZO Login Error:", error);
        res.status(500).json({ message: 'Server xatosi (E-IMZO)' });
    }
};

module.exports = { login, registerSetup, eimzoLogin };
