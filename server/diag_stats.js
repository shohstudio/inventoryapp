const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diag() {
    try {
        const warehouseFilter = { inventoryType: { not: 'tmj' } };
        const inStockFilter = {
            ...warehouseFilter,
            status: { not: 'written-off' },
            assignedUserId: null,
            initialOwner: null
        };

        const count = await prisma.item.count({ where: warehouseFilter });
        console.log("Count with warehouseFilter:", count);

        const inStockCount = await prisma.item.count({ where: inStockFilter });
        console.log("Count with inStockFilter:", inStockCount);

        const items = await prisma.item.findMany({
            where: inStockFilter,
            select: { price: true, quantity: true, name: true }
        });
        
        console.log("Items found:", items.length);
        if (items.length > 0) {
            console.log("First item:", items[0]);
            console.log("Type of price:", typeof items[0].price);
            console.log("Price value:", items[0].price);
            
            const total = items.reduce((acc, item) => {
                const p = Number(item.price || 0);
                const q = item.quantity || 1;
                console.log(`Item: ${item.name}, Price: ${item.price} (Number: ${p}), Qty: ${q}`);
                return acc + (p * q);
            }, 0);
            console.log("Calculated Total:", total);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

diag();
