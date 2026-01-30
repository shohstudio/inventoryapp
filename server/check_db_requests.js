const prisma = require('./src/utils/prisma');

async function main() {
    const requests = await prisma.request.findMany({
        take: 5,
        orderBy: {
            createdAt: 'desc',
        },
        select: {
            id: true,
            status: true,
            accountantDocument: true,
            item: {
                select: {
                    name: true
                }
            }
        },
    });

    console.log("Latest 5 Request Logs:");
    console.log(JSON.stringify(requests, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
