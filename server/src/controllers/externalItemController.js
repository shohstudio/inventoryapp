const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Get all external items (optionally filter by status)
// @route   GET /api/external-items
// @access  Private/Guard/Admin
const getExternalItems = async (req, res) => {
    try {
        const { status } = req.query;
        let where = {};
        if (status) {
            where.status = status;
        }

        const items = await prisma.externalItem.findMany({
            where,
            orderBy: { enteredAt: 'desc' },
            include: { guard: { select: { name: true } } }
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register new external item entry
// @route   POST /api/external-items
// @access  Private/Guard/Admin
const registerEntry = async (req, res) => {
    try {
        const { itemName, description, ownerName, notes } = req.body;

        const shortId = Math.floor(10000 + Math.random() * 90000).toString(); // Simple 5-digit ID

        const newItem = await prisma.externalItem.create({
            data: {
                itemName,
                description,
                ownerName,
                notes,
                shortId,
                guardId: req.user.id
            }
        });

        res.status(201).json(newItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Mark external item as exited
// @route   PUT /api/external-items/:id/exit
// @access  Private/Guard/Admin
const markExit = async (req, res) => {
    try {
        const item = await prisma.externalItem.update({
            where: { id: parseInt(req.params.id) },
            data: {
                status: 'exited',
                exitedAt: new Date()
            }
        });
        res.json(item);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getExternalItems,
    registerEntry,
    markExit
};
