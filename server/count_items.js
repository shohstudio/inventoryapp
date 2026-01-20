const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.item.count();
        console.log(`Total Items in DB: ${count}`);

        if (count > 0) {
            const firstItem = await prisma.item.findFirst();
            console.log('First Item:', firstItem);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
