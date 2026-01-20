const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getSettings = async (req, res) => {
    try {
        const settings = await prisma.settings.findMany();
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        res.json(settingsMap);
    } catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ message: "Settings yuklashda xatolik" });
    }
};

const updateInventoryDates = async (req, res) => {
    const { startDate, endDate } = req.body;
    try {
        await prisma.$transaction([
            prisma.settings.upsert({
                where: { key: 'inventoryStartDate' },
                update: { value: startDate || '' },
                create: { key: 'inventoryStartDate', value: startDate || '' }
            }),
            prisma.settings.upsert({
                where: { key: 'inventoryEndDate' },
                update: { value: endDate || '' },
                create: { key: 'inventoryEndDate', value: endDate || '' }
            })
        ]);
        res.json({ message: "Invertar sanalari saqlandi" });
    } catch (error) {
        console.error("Error saving settings:", error);
        res.status(500).json({ message: "Sozlamalarni saqlashda xatolik" });
    }
};

module.exports = {
    getSettings,
    updateInventoryDates
};
