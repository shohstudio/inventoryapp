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
        console.log(`[Stats] Total Users: ${userCount}`);
        const lastMonthUserCount = await prisma.user.count({
            where: { createdAt: { lt: firstDayCurrentMonth } }
        });
        const userTrend = calculateTrend(userCount, lastMonthUserCount);

        // 2. Item Stats & Trends (Warehouse Only)
        // Exclude TMJ - Explicitly include warehouse OR NULL to be safe
        const warehouseFilter = {
            OR: [
                { inventoryType: 'warehouse' },
                { inventoryType: null }
            ]
        };

        const totalItemsCount = await prisma.item.count({
            where: {
                ...warehouseFilter,
                status: { not: 'written-off' }
            }
        });
        console.log(`[Stats] Warehouse Active Items: ${totalItemsCount}`);

        const totalItemsAll = await prisma.item.count({ where: warehouseFilter });
        console.log(`[Stats] Warehouse Total Items: ${totalItemsAll}`);

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
        console.log(`[Stats] Warehouse Repair Items: ${repairItems}`);

        const writtenOffItems = await prisma.item.count({
            where: {
                ...warehouseFilter,
                status: 'written-off'
            }
        });
        console.log(`[Stats] Warehouse Written-Off Items: ${writtenOffItems}`);

        // 3. Total Value Trend (Warehouse Only & ONLY IN STOCK)
        // User requested: "TMZ dagi maxsulot topshiirilganda umumiy qiymatdan pulni olib tashla"
        // Interpretation: Substract price if assignedUserId OR initialOwner is NOT null (handed over)
        // Ensure we handle both NULL and empty string for initialOwner to be robust
        const inStockFilter = {
            ...warehouseFilter,
            status: { not: 'written-off' },
            assignedUserId: null,
            AND: [
                { OR: [{ initialOwner: null }, { initialOwner: '' }] }
            ]
        };

        const currentItemsValue = await prisma.item.findMany({
            where: inStockFilter,
            select: { price: true, quantity: true, name: true }
        });

        console.log(`[Stats] Items contributing to value: ${currentItemsValue.length}`);

        const totalValue = currentItemsValue.reduce((acc, item) => {
            const price = parseFloat(item.price?.toString() || 0);
            const quantity = parseInt(item.quantity || 1);
            return acc + (price * quantity);
        }, 0);
        console.log(`[Stats] Calculated Total Value: ${totalValue}`);

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
        console.log(`[Stats] Last Month Value (approx): ${lastMonthValue}, Value Trend: ${valueTrend}`);

        // 4. Verified Items
        let totalVerifiedItems = 0;
        const startDateSetting = await prisma.settings.findUnique({ where: { key: 'inventory_start_date' } });
        let inventoryStartDate = null;

        if (startDateSetting?.value) {
            inventoryStartDate = new Date(startDateSetting.value);
            totalVerifiedItems = await prisma.item.count({
                where: {
                    ...warehouseFilter, // Only count warehouse items verified
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
        console.log(`[Stats] Verified Items: ${totalVerifiedItems}`);

        // Verified Trend = Percentage of total items verified
        const verifiedTrend = totalItemsAll > 0 ? Number(((totalVerifiedItems / totalItemsAll) * 100).toFixed(1)) : 0;
        console.log(`[Stats] Verified Trend (coverage): ${verifiedTrend}%`);

        // 5. Recent Items (Warehouse Only)
        const recentItems = await prisma.item.findMany({
            where: warehouseFilter,
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { assignedTo: { select: { name: true } } }
        });
        console.log(`[Stats] Recent Items fetched: ${recentItems.length}`);

        res.json({
            userCount,
            userTrend,
            inventory: {
                totalItems: totalItemsCount,
                itemTrend,
                repairItems,
                repairTrend: 0, // Placeholder
                writtenOffItems,
                writtenOffTrend: 0, // Placeholder
                totalValue,
                valueTrend,
                totalVerifiedItems,
                verifiedTrend, // Now it is percentage coverage
                recentItems
            }
        });
    } catch (error) {
        console.error("Get Stats Error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardStats };
