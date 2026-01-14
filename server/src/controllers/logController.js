const prisma = require('../utils/prisma');

// @desc    Get all logs
// @route   GET /api/logs
// @access  Private/Admin
const getLogs = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                // End of the day for the end date
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        const logs = await prisma.log.findMany({
            where,
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
