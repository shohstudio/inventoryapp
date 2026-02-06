const prisma = require('./src/utils/prisma');

async function test() {
    try {
        const now = new Date();
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const warehouseFilter = {
            OR: [
                { inventoryType: 'warehouse' },
                { inventoryType: null }
            ]
        };

        console.log("Testing totalItems...");
        const totalItems = await prisma.item.count({
            where: {
                ...warehouseFilter,
                status: { not: 'written-off' }
            }
        });
        console.log("totalItems:", totalItems);

        console.log("Testing totalItemsAll...");
        const totalItemsAll = await prisma.item.count({ where: warehouseFilter });
        console.log("totalItemsAll:", totalItemsAll);

        console.log("Testing currentItemsValue...");
        const inStockFilter = {
            ...warehouseFilter,
            status: { not: 'written-off' },
            assignedUserId: null,
            initialOwner: null
        };

        const currentItemsValue = await prisma.item.findMany({
            where: inStockFilter,
            select: { price: true, quantity: true }
        });
        console.log("currentItemsValue length:", currentItemsValue.length);

        const totalValue = currentItemsValue.reduce((acc, item) => {
            const price = parseFloat(item.price || 0);
            const quantity = parseInt(item.quantity || 1);
            return acc + (price * quantity);
        }, 0);
        console.log("totalValue:", totalValue);

        console.log("Success!");
    } catch (error) {
        console.error("FAILED:", error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
