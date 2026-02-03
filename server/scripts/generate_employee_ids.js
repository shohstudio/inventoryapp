const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateEmployeeId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function main() {
    console.log("Starting Employee ID generation...");

    // Get all users without employeeId
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { employeeId: null },
                { employeeId: "" }
            ]
        }
    });

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
