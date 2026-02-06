const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const now = new Date();
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        console.log("1. Testing User Count...");
        const userCount = await prisma.user.count();
        console.log("Success: ", userCount);

        console.log("2. Testing warehouseFilter (OR with null)...");
        const warehouseFilter = {
            OR: [
                { inventoryType: 'warehouse' },
                { inventoryType: null }
            ]
        };
        const totalItemsAll = await prisma.item.count({ where: warehouseFilter });
        console.log("Success: ", totalItemsAll);

        console.log("3. Testing inStockFilter with nested AND/OR...");
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
            select: { price: true, quantity: true }
        });
        console.log("Success: found items:", currentItemsValue.length);

        console.log("4. Testing verifiedItems count...");
        const verifiedCount = await prisma.item.count({
            where: {
                ...warehouseFilter,
                lastCheckedAt: { not: null }
            }
        });
        console.log("Success: ", verifiedCount);

        console.log("DIAGNOSTIC COMPLETE - ALL QUERIES SUCCESSFUL");
    } catch (e) {
        console.error("DIAGNOSTIC FAILED:", e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
