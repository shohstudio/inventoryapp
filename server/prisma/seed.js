const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('admin', 10);

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            password: password, // Update password if exists just in case
            role: 'admin'
        },
        create: {
            name: 'Admin User',
            username: 'admin',
            password,
            role: 'admin',
            status: 'active'
        },
    });

    console.log('Admin user created/updated:', admin);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
