const prisma = require('../utils/prisma');

// @desc    Get dashboard statistics
// @route   GET /api/stats/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Helper for percentage change
        const calculateTrend = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Number((((current - previous) / previous) * 100).toFixed(1));
        };

        // 1. User Count & Trend
        const userCount = await prisma.user.count();
        const lastMonthUserCount = await prisma.user.count({
            where: { createdAt: { lt: firstDayCurrentMonth } }
        });
        const userTrend = calculateTrend(userCount, lastMonthUserCount);

        // 2. Item Stats & Trends (Warehouse Only)
        // Exclude TMJ items from all main dashboard counts
        const warehouseFilter = { inventoryType: { not: 'tmj' } };

        const totalItemsCount = await prisma.item.count({
            where: {
                ...warehouseFilter,
                status: { not: 'written-off' }
            }
        });

        const totalItemsAll = await prisma.item.count({ where: warehouseFilter });

        const lastMonthTotalItems = await prisma.item.count({
            where: {
                ...warehouseFilter,
                createdAt: { lt: firstDayCurrentMonth }
            }
        });
        const itemTrend = calculateTrend(totalItemsAll, lastMonthTotalItems);

        const repairItems = await prisma.item.count({
            where: {
                ...warehouseFilter,
                status: 'repair'
            }
        });

        const writtenOffItems = await prisma.item.count({
            where: {
                ...warehouseFilter,
                status: 'written-off'
            }
        });

        // 3. Total Value Trend (Warehouse Only & ONLY IN STOCK)
        // User requested: "TMZ dagi maxsulot topshiirilganda umumiy qiymatdan pulni olib tashla"
        const inStockFilter = {
            ...warehouseFilter,
            status: { not: 'written-off' },
            // Robust check for unassigned items: handle both null and empty strings
            OR: [
                { assignedUserId: null },
                { assignedUserId: 0 } // Just in case 0 is used for unassigned
            ],
            AND: [
                {
                    OR: [
                        { initialOwner: null },
                        { initialOwner: '' }
                    ]
                }
            ]
        };

        const currentItemsValue = await prisma.item.findMany({
            where: inStockFilter,
            select: { price: true, quantity: true }
        });

        const totalValue = currentItemsValue.reduce((acc, item) => {
            const price = parseFloat(item.price?.toString() || 0);
            const quantity = parseInt(item.quantity || 1);
            return acc + (price * quantity);
        }, 0);

        // Value last month (Approximate)
        const newItemsThisMonth = await prisma.item.findMany({
            where: {
                ...inStockFilter,
                createdAt: { gte: firstDayCurrentMonth }
            },
            select: { price: true, quantity: true }
        });
        const newValue = newItemsThisMonth.reduce((acc, item) => {
            const price = parseFloat(item.price?.toString() || 0);
            const quantity = parseInt(item.quantity || 1);
            return acc + (price * quantity);
        }, 0);

        const lastMonthValue = totalValue - newValue;
        const valueTrend = calculateTrend(totalValue, lastMonthValue);

        // 4. Verified Items
        let totalVerifiedItems = 0;
        const startDateSetting = await prisma.settings.findUnique({ where: { key: 'inventory_start_date' } });
        let inventoryStartDate = null;

        if (startDateSetting?.value) {
            inventoryStartDate = new Date(startDateSetting.value);
            totalVerifiedItems = await prisma.item.count({
                where: {
                    ...warehouseFilter,
                    lastCheckedAt: { gte: inventoryStartDate }
                }
            });
        } else {
            totalVerifiedItems = await prisma.item.count({
                where: {
                    ...warehouseFilter,
                    lastCheckedAt: { not: null }
                }
            });
        }

        // Verified Trend = Percentage of total items verified
        const verifiedTrend = totalItemsAll > 0 ? Number(((totalVerifiedItems / totalItemsAll) * 100).toFixed(1)) : 0;

        // 5. Recent Items (Warehouse Only)
        const recentItems = await prisma.item.findMany({
            where: warehouseFilter,
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { assignedTo: { select: { name: true } } }
        });

        res.json({
            userCount,
            userTrend,
            inventory: {
                totalItems: totalItemsCount,
                itemTrend,
                repairItems,
                repairTrend: 0,
                writtenOffItems,
                writtenOffTrend: 0,
                totalValue,
                valueTrend,
                totalVerifiedItems,
                verifiedTrend,
                recentItems
            }
        });
    } catch (error) {
        console.error("Get Dashboard Stats Error:", error);
        res.status(500).json({ message: error.message });
    }
};

const getTMJStats = async (req, res) => {
    try {
        const tmjFilter = { inventoryType: 'tmj', status: { not: 'written-off' } };

        const allTmjItems = await prisma.item.findMany({
            where: tmjFilter,
            select: { price: true, quantity: true, assignedUserId: true, initialOwner: true }
        });

        let totalProducts = 0;
        let handedOverProducts = 0;
        let totalValue = 0;
        let handedOverValue = 0;

        allTmjItems.forEach(item => {
            const price = parseFloat(item.price?.toString() || 0);
            const qty = parseFloat(item.quantity || 0); // Use parseFloat for decimal support
            const isHandedOver = !!(item.assignedUserId || (item.initialOwner && item.initialOwner !== ""));

            totalProducts += qty;
            totalValue += (price * qty);

            if (isHandedOver) {
                handedOverProducts += qty;
                handedOverValue += (price * qty);
            }
        });

        res.json({
            totalItems: totalProducts,
            handedOverCount: handedOverProducts,
            stockCount: totalProducts - handedOverProducts,
            totalValue,
            handedOverValue,
            stockValue: totalValue - handedOverValue
        });
    } catch (error) {
        console.error("Get TMJ Stats Error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardStats, getTMJStats };
