const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    const pinfl = '12345678898766';
    const user = await prisma.user.findFirst({
        where: { pinfl: pinfl }
    });
    console.log(`User with PINFL ${pinfl}:`, user);
}

checkUser()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
