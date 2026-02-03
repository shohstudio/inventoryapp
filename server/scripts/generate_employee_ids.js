const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateEmployeeId() {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

async function main() {
    console.log("Starting Employee ID generation...");

    // Get all users to ensure 5-digit format
    const users = await prisma.user.findMany();

    console.log(`Found ${users.length} users to update.`);

    for (const user of users) {
        let unique = false;
        let newId = "";

        // Ensure uniqueness
        while (!unique) {
            newId = generateEmployeeId();
            const exists = await prisma.user.findUnique({
                where: { employeeId: newId }
            });
            if (!exists) unique = true;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { employeeId: newId }
        });

        console.log(`Updated user ${user.username} (${user.name}) with ID: ${newId}`);
    }

    console.log("All users updated successfully.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
