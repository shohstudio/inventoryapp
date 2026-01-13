const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function verify() {
    try {
        console.log("--- START VERIFICATION ---");
        const user = await prisma.user.findUnique({ where: { username: 'admin' } });

        if (!user) {
            console.log("ERROR: User 'admin' not found!");
            return;
        }

        console.log("User found:", user.username);
        console.log("Stored Hash:", user.password);

        const isMatch = await bcrypt.compare('admin', user.password);
        console.log("Checking password 'admin'...");
        console.log("RESULT:", isMatch ? "MATCH ✅" : "FAIL ❌");

    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
