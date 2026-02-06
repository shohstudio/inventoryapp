const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRequest() {
    try {
        const req = await prisma.request.findUnique({
            where: { id: 36494 }
        });
        console.log("Request 36494:", req);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkRequest();
