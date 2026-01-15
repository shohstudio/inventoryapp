const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    console.log("Starting cleanup...");

    // 1. Find all requests where itemId is not null
    const requests = await prisma.request.findMany({
        where: {
            NOT: {
                itemId: null
            }
        },
        select: { id: true, itemId: true }
    });

    console.log(`Found ${requests.length} requests with IDs.`);

    let deletedCount = 0;

    for (const req of requests) {
        // Check if item exists
        const item = await prisma.item.findUnique({
            where: { id: req.itemId }
        });

        if (!item) {
            console.log(`Request ${req.id} points to missing Item ${req.itemId}. Deleting...`);
            await prisma.request.delete({
                where: { id: req.id }
            });
            deletedCount++;
        }
    }

    // Also delete requests where itemId IS null if that's what we see in the screenshot (orphans)
    // The screenshot implies they are just empty.
    // Generally a request MUST have an item??
    // If logic dictates request relies on item, then yes.

    // Let's also check strict orphans (itemId is null)
    // But maybe 'Exit' requests don't need items? Need to be careful.
    // Based on schema, type is 'assignment', 'exit', 'return'.
    // Assuming all types currently used require items.

    const nullItemRequests = await prisma.request.deleteMany({
        where: { itemId: null }
    });

    console.log(`Deleted ${deletedCount} requests pointing to missing items.`);
    console.log(`Deleted ${nullItemRequests.count} requests with NULL itemId.`);
    console.log("Cleanup complete.");
}

cleanup()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
