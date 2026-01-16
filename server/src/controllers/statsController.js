const prisma = require('../utils/prisma');

// @desc    Get dashboard statistics
// @route   GET /api/stats/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        // 1. User Count
        const userCount = await prisma.user.count();

        // 2. Item Stats
        const totalItems = await prisma.item.count();
        const repairItems = await prisma.item.count({ where: { status: 'repair' } });
        const writtenOffItems = await prisma.item.count({ where: { status: 'written-off' } });

        // 3. Total Value (Sum of price * quantity, excluding written-off)
        // Prisma aggregate
        const totalValueAgg = await prisma.item.aggregate({
            _sum: {
                price: true
            },
            where: {
                status: { not: 'written-off' }
            }
        });
        // Note: We assume quantity is 1 for now if not stored or handled separately in sum. 
        // If quantity exists in schema, we might need raw query or handle differently.
        // Schema has `quantity Int @default(1)`.
        // Prisma doesn't support sum(price * quantity) directly in aggregate without raw query.
        // Let's check schema again. Yes, has quantity.
        // For accurate value, we should use raw query or fetch all prices/quantities (but that's heavy).
        // OR better: average quantity is 1? 
        // Let's use raw query for speed and accuracy.

        const totalValueRaw = await prisma.$queryRaw`
            SELECT SUM(price * quantity) as total 
            FROM Item 
            WHERE status != 'written-off'
        `;

        const totalValue = totalValueRaw[0]?.total || 0;

        // 4. Recent Items
        const recentItems = await prisma.item.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                assignedTo: { select: { name: true } }
            }
        });

        res.json({
            userCount,
            inventory: {
                totalItems,
                repairItems,
                writtenOffItems,
                totalValue,
                recentItems
            }
        });
    } catch (error) {
        console.error("Get Stats Error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardStats };
