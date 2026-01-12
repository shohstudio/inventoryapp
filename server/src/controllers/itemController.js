const prisma = require('../utils/prisma');

// @desc    Get all items
// @route   GET /api/items
// @access  Private
const getItems = async (req, res) => {
    try {
        const items = await prisma.item.findMany({
            include: {
                assignedTo: {
                    select: { name: true, pinfl: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Private
const getItemById = async (req, res) => {
    try {
        const item = await prisma.item.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                assignedTo: {
                    select: { name: true, pinfl: true }
                }
            }
        });

        if (item) {
            res.json(item);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new item
// @route   POST /api/items
// @access  Private/Admin/Warehouseman
const createItem = async (req, res) => {
    try {
        const {
            name, model, serialNumber, category, subCategory,
            price, quantity, purchaseDate, status, condition,
            building, location, department, assignedUserId
        } = req.body;

        const image = req.file ? `/uploads/${req.file.filename}` : null;

        const item = await prisma.item.create({
            data: {
                name,
                model,
                serialNumber,
                category,
                subCategory,
                price: price ? parseFloat(price) : 0,
                quantity: quantity ? parseInt(quantity) : 1,
                purchaseDate,
                status,
                condition,
                building,
                location,
                department,
                assignedUserId: assignedUserId ? parseInt(assignedUserId) : null,
                assignedDate: assignedUserId ? new Date() : null,
                image
            }
        });

        // Log creation
        await prisma.log.create({
            data: {
                action: 'create',
                details: `Item created: ${name}`,
                userId: req.user.id,
                itemId: item.id
            }
        });

        res.status(201).json(item);
    } catch (error) {
        console.error(error);
        if (error.code === 'P2002' && error.meta?.target?.includes('serialNumber')) {
            return res.status(400).json({ message: "Bunday Seriya/INN raqamli jihoz allaqachon mavjud!" });
        }
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private/Admin/Warehouseman
const updateItem = async (req, res) => {
    try {
        const {
            name, model, serialNumber, category, subCategory,
            price, quantity, purchaseDate, status, condition,
            building, location, department, assignedUserId
        } = req.body;

        const dataToUpdate = {
            name, model, serialNumber, category, subCategory,
            price: price ? parseFloat(price) : undefined,
            quantity: quantity ? parseInt(quantity) : undefined,
            purchaseDate, status, condition,
            building, location, department
        };

        if (req.file) {
            dataToUpdate.image = `/uploads/${req.file.filename}`;
        }

        // Handle Assignment Logic
        // If assignedUserId is present (even if it's the same), we update it.
        // If it's explicitly 'null' string from formData, we unassign.
        if (assignedUserId !== undefined) {
            // Logic to update assignedUserId and assignedDate
            if (assignedUserId === 'null' || assignedUserId === null || assignedUserId === "") {
                dataToUpdate.assignedUserId = null;
                dataToUpdate.assignedDate = null;
            } else {
                dataToUpdate.assignedUserId = parseInt(assignedUserId);
                // Only update date if it wasn't assigned before or changed user? 
                // Simple logic: update date on assignment
                dataToUpdate.assignedDate = new Date();
            }
        }

        const item = await prisma.item.update({
            where: { id: parseInt(req.params.id) },
            data: dataToUpdate
        });

        // Log update
        await prisma.log.create({
            data: {
                action: 'update',
                details: `Item updated: ${name}`,
                userId: req.user.id,
                itemId: item.id
            }
        });

        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Private/Admin
const deleteItem = async (req, res) => {
    try {
        await prisma.item.delete({
            where: { id: parseInt(req.params.id) }
        });

        // Log delete
        await prisma.log.create({
            data: {
                action: 'delete',
                details: `Item deleted ID: ${req.params.id}`,
                userId: req.user.id
            }
        });

        res.json({ message: 'Item removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const xlsx = require('xlsx');
const fs = require('fs');

// @desc    Import items from Excel
// @route   POST /api/items/import
// @access  Private/Admin
const importItems = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Fayl yuklanmadi" });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const itemsToCreate = [];

        for (const row of data) {
            // Map columns. Assume Uzbek headers or fallback.
            // Keys in 'row' depend on the Excel header row.

            // Flexible matching helper
            const getVal = (keys) => {
                for (let k of keys) {
                    if (row[k] !== undefined) return row[k];
                }
                return null;
            };

            const name = getVal(['Nomi', 'Name', 'Jihoz nomi', 'name']);
            if (!name) continue; // Skip empty rows

            const statusRaw = getVal(['Holati', 'Status', 'status']) || 'working';
            let status = 'working';
            const s = String(statusRaw).toLowerCase();
            if (s.includes('ta\'mir') || s.includes('repair')) status = 'repair';
            else if (s.includes('chiqarilgan') || s.includes('write')) status = 'written-off';
            else if (s.includes('buzilgan') || s.includes('broken')) status = 'broken';

            itemsToCreate.push({
                name: String(name),
                model: String(getVal(['Model', 'model']) || ''),
                serialNumber: getVal(['Seriya', 'Serial', 'Seriya raqami', 'serial', 'serialNumber']) ? String(getVal(['Seriya', 'Serial', 'Seriya raqami', 'serial', 'serialNumber'])) : null,
                category: String(getVal(['Kategoriya', 'Category', 'category']) || 'Boshqa'),
                subCategory: String(getVal(['Subkategoriya', 'SubCategory']) || ''),
                price: parseFloat(String(getVal(['Narx', 'Price', 'Narxi', 'price']) || '0').replace(/[^0-9.]/g, '')),
                quantity: parseInt(String(getVal(['Soni', 'Quantity', 'quantity']) || '1')),
                purchaseDate: String(getVal(['Xarid sanasi', 'Purchase Date', 'purchaseDate']) || ''),
                building: String(getVal(['Bino', 'Building', 'building']) || ''),
                location: String(getVal(['Joylashuv', 'Location', 'location']) || 'Ombor'),
                department: String(getVal(['Bo\'lim', 'Department', 'department']) || ''),
                status: status
            });
        }

        if (itemsToCreate.length > 0) {
            // Use transaction or createMany with skipDuplicates (if supported) or loop
            // Prisma createMany skipDuplicates is supported for SQLite in newer versions.

            // However, to give feedback on exactly WHICH one failed is hard with createMany. 
            // Let's try createMany first.
            // 0. Deduplicate items within the file itself
            const uniqueFileItemsMap = new Map();
            const itemsWithoutSerial = [];

            for (const item of itemsToCreate) {
                if (item.serialNumber) {
                    if (!uniqueFileItemsMap.has(item.serialNumber)) {
                        uniqueFileItemsMap.set(item.serialNumber, item);
                    }
                } else {
                    itemsWithoutSerial.push(item);
                }
            }
            // Combine unique serial items + all items without serial
            const uniqueFileItems = [...Array.from(uniqueFileItemsMap.values()), ...itemsWithoutSerial];

            // 1. Get all serial numbers from the unique file items
            const serials = uniqueFileItems.map(item => item.serialNumber).filter(s => s);

            // 2. Find which ones already exist in DB
            const existingItems = await prisma.item.findMany({
                where: {
                    serialNumber: { in: serials }
                },
                select: { serialNumber: true }
            });

            const existingSerials = new Set(existingItems.map(i => i.serialNumber));

            // 3. Filter out duplicates (both internal and existing)
            // Only filter if item has a serial number AND it exists in DB
            const newItems = uniqueFileItems.filter(item => !item.serialNumber || !existingSerials.has(item.serialNumber));

            // 4. Insert only new items
            if (newItems.length > 0) {
                await prisma.item.createMany({
                    data: newItems
                });

                // Log import
                await prisma.log.create({
                    data: {
                        action: 'import',
                        details: `Imported ${newItems.length} items from Excel (Skipped ${itemsToCreate.length - newItems.length} duplicates)`,
                        userId: req.user.id
                    }
                });
            }

            // Cleanup uploaded file
            fs.unlinkSync(req.file.path);

            return res.json({
                message: `${newItems.length} ta yangi jihoz yuklandi! (${itemsToCreate.length - newItems.length} ta dublikat tashlab ketildi)`
            });
            // End of new logic, ensuring we don't fall through to old response

            /* Old response code below effectively unreachable or needs removal - handling via larger replacement would be cleaner but this tool call is minimized */



        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Import xatoligi: ' + error.message });
    }
};

module.exports = { getItems, getItemById, createItem, updateItem, deleteItem, importItems };
