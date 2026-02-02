const prisma = require('../utils/prisma');

// @desc    Get all logs
// @route   GET /api/logs
// @access  Private/Admin
const getLogs = async (req, res) => {
    try {
        const { startDate, endDate, userId, itemId } = req.query;

        let where = {};

        if (userId) where.userId = parseInt(userId);
        if (itemId) where.itemId = parseInt(itemId);

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

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const [logs, total] = await prisma.$transaction([
            prisma.log.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        select: { name: true, role: true, image: true }
                    },
                    item: {
                        select: { name: true, serialNumber: true }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.log.count({ where })
        ]);

        res.json({
            logs,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getLogs };
