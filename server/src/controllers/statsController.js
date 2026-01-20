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
        // Fetch only necessary fields to calculate in memory (safer than raw query)
        const itemsForValue = await prisma.item.findMany({
            where: {
                status: { not: 'written-off' }
            },
            select: {
                price: true,
                quantity: true
            }
        });

        const totalValue = itemsForValue.reduce((acc, item) => {
            const price = Number(item.price) || 0; // Ensure number (Prisma Decimal to Number)
            const quantity = item.quantity || 1;
            return acc + (price * quantity);
        }, 0);

        // 4. Verified Items (Checked in current inventory period)
        let totalVerifiedItems = 0;
        const startDateSetting = await prisma.settings.findUnique({
            where: { key: 'inventory_start_date' }
        });

        if (startDateSetting && startDateSetting.value) {
            const startDate = new Date(startDateSetting.value);
            totalVerifiedItems = await prisma.item.count({
                where: {
                    lastCheckedAt: {
                        gte: startDate
                    }
                }
            });
        } else {
            // If no date set, count all that have ever been checked? Or 0?
            // Usually implies no active inventory period, but let's count all with lastCheckedAt for now or 0.
            // Better to be 0 or all. Let's count all checked for safety if no date.
            totalVerifiedItems = await prisma.item.count({
                where: {
                    lastCheckedAt: { not: null }
                }
            });
        }

        // 5. Recent Items
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
                totalVerifiedItems,
                recentItems
            }
        });
    } catch (error) {
        console.error("Get Stats Error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardStats };
