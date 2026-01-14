const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                role: true,
                department: true,
                position: true,
                status: true,
                pinfl: true,
                createdAt: true,
                _count: {
                    select: { items: true }
                }
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.params.id) },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                role: true,
                department: true,
                position: true,
                status: true,
                pinfl: true,
                items: true
            }
        });

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
    const { name, username, email, password, role, department, position, status, pinfl } = req.body;
    console.log("CREATE USER REQUEST - Password received:", `'${password}'`);

    try {
        // Check for existing user by username, email, OR pinfl
        const existingUsers = await prisma.user.findMany({
            where: {
                OR: [
                    { username: username },
                    { email: email || undefined }, // undefined to skip if email is null 
                    { pinfl: pinfl || undefined }
                ]
            }
        });

        if (existingUsers.length > 0) {
            const conflict = existingUsers[0];
            let message = 'Foydalanuvchi allaqachon mavjud';
            if (conflict.username === username) message = 'Bu foydalanuvchi nomi band (username)';
            else if (conflict.email === email) message = 'Bu email allaqachon ro\'yxatdan o\'tgan';
            else if (conflict.pinfl === pinfl) message = 'Bu PINFL raqami allaqachon mavjud';

            return res.status(400).json({ message });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                name,
                username,
                email,
                password: hashedPassword,
                role,
                department,
                position,
                status,
                pinfl
            }
        });

        // Log creation
        await prisma.log.create({
            data: {
                action: 'create_user',
                details: `Foydalanuvchi yaratildi: ${name} (${username})`,
                userId: req.user.id
            }
        });

        res.status(201).json(user);

        // Retroactive Assignment Check
        // If items were imported with this PINFL but no user existed then, we link them now via a Request.
        if (pinfl) {
            const pendingItems = await prisma.item.findMany({
                where: {
                    initialPinfl: pinfl,
                    assignedUserId: null
                }
            });

            if (pendingItems.length > 0) {
                console.log(`Found ${pendingItems.length} items for new user ${name} (${pinfl}). Creating requests...`);

                const requestsData = pendingItems.map(item => ({
                    type: 'assignment',
                    status: 'pending_employee', // Direct to employee for approval
                    itemId: item.id,
                    requesterId: req.user.id, // Admin who created the user is technically the requester
                    targetUserId: user.id,
                    description: "Avvalgi importdan qolgan biriktirilmagan jihoz (PINFL mosligi bo'yicha)"
                }));

                await prisma.request.createMany({
                    data: requestsData
                });
            }
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    const { name, username, email, password, role, department, position, status, pinfl } = req.body;

    try {
        const dataToUpdate = {
            name,
            username,
            email,
            role,
            department,
            position,
            status,
            pinfl
        };

        if (password) {
            const salt = await bcrypt.genSalt(10);
            dataToUpdate.password = await bcrypt.hash(password, salt);
        }

        const user = await prisma.user.update({
            where: { id: parseInt(req.params.id) },
            data: dataToUpdate
        });

        // Log update
        await prisma.log.create({
            data: {
                action: 'update_user',
                details: `Foydalanuvchi yangilandi: ${user.name} (${user.username})`,
                userId: req.user.id
            }
        });

        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        await prisma.user.delete({
            where: { id: parseInt(req.params.id) }
        });

        // Log delete
        await prisma.log.create({
            data: {
                action: 'delete_user',
                details: `Foydalanuvchi o'chirildi ID: ${req.params.id}`,
                userId: req.user.id
            }
        });
        res.json({ message: 'User removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check if use exists (for frontend validation)
// @route   POST /api/users/check-availability
// @access  Private/Admin
const checkAvailability = async (req, res) => {
    try {
        const { username, email, pinfl, excludeId } = req.body;
        const where = { OR: [] };

        if (username) where.OR.push({ username });
        if (email) where.OR.push({ email });
        if (pinfl) where.OR.push({ pinfl });

        if (where.OR.length === 0) return res.json({ available: true });

        const exists = await prisma.user.findFirst({
            where: {
                AND: [
                    { OR: where.OR },
                    excludeId ? { NOT: { id: parseInt(excludeId) } } : {}
                ]
            }
        });

        if (exists) {
            let message = 'Band';
            if (exists.username === username) message = 'Login band';
            if (exists.email === email) message = 'Email band';
            if (exists.pinfl === pinfl) message = 'PINFL band';

            return res.json({ available: false, message });
        }

        res.json({ available: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, checkAvailability };
