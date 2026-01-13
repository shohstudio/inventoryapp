const prisma = require('../utils/prisma');

// @desc    Get all logs
// @route   GET /api/logs
// @access  Private/Admin
const getLogs = async (req, res) => {
    try {
        const logs = await prisma.log.findMany({
            include: {
                user: {
                    select: { name: true, role: true }
                },
                item: {
                    select: { name: true, serialNumber: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getLogs };
