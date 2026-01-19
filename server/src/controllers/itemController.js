const prisma = require('../utils/prisma');

// @desc    Get all items
// @route   GET /api/items
// @access  Private
const getItems = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            status,
            category,
            building,
            location,
            assignedUserId,
            isAssigned // 'unassigned', 'pending', 'all'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        let where = {};

        // Search Filter
        if (search) {
            where.OR = [
                { name: { contains: search } }, // SQLite is case-insensitive by default roughly, or basic
                { model: { contains: search } },
                { serialNumber: { contains: search } },
                { inn: { contains: search } },
                { orderNumber: { contains: search } },
                { assignedTo: { name: { contains: search } } } // Search by assigned user name too
            ];
            // Try to parse search as ID if number
            if (!isNaN(search)) {
                where.OR.push({ id: parseInt(search) });
            }
        }

        // Exact Filters
        if (status && status !== 'all') where.status = status;
        if (category) where.category = category;
        if (building) where.building = building;
        if (location) where.location = { contains: location }; // Loose match for location

        if (assignedUserId) {
            where.assignedUserId = parseInt(assignedUserId);
        }

        // Warehouse Specific Filters
        if (isAssigned === 'unassigned') {
            where.assignedUserId = null;
            // Also ensure no active requests if strict "Available in Warehouse"
            where.requests = {
                none: {
                    status: { in: ['pending_accountant', 'pending_employee'] }
                }
            };
        } else if (isAssigned === 'pending') {
            where.requests = {
                some: {
                    status: { in: ['pending_accountant', 'pending_employee'] }
                }
            };
        }

        const [items, total] = await prisma.$transaction([
            prisma.item.findMany({
                where,
                skip,
                take,
                include: {
                    assignedTo: {
                        select: { name: true, pinfl: true, position: true }
                    },
                    requests: {
                        where: {
                            status: { in: ['pending_accountant', 'pending_employee'] }
                        },
                        select: {
                            id: true,
                            status: true,
                            targetUser: { select: { name: true } }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.item.count({ where })
        ]);

        res.json({
            items,
            metadata: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error("getItems Error:", error);
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
                    select: { name: true, pinfl: true, position: true }
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
            name, model, serialNumber, inn, orderNumber, category, subCategory,
            price, quantity, purchaseDate, status, condition,
            building, location, department, assignedUserId,
            assignedPINFL, assignedTo, assignedRole // Extract new fields
        } = req.body;

        // MULTI-IMAGE HANDLING
        let image = null;
        let images = [];

        if (req.files && req.files.length > 0) {
            // New multi-upload
            images = req.files.map(file => `/uploads/${file.filename}`);
            image = images[0]; // Set first image as Main Image
        } else if (req.file) {
            // Fallback for single file (legacy) if someone uses old endpoint
            image = `/uploads/${req.file.filename}`;
            images = [image];
        }

        // Check if User exists by PINFL or assignedUserId
        let targetUser = null;
        if (assignedUserId) {
            targetUser = await prisma.user.findUnique({ where: { id: parseInt(assignedUserId) } });
        } else if (assignedPINFL) {
            targetUser = await prisma.user.findFirst({ where: { pinfl: assignedPINFL } });
        }

        const itemData = {
            name,
            model,
            serialNumber,
            inn,
            orderNumber,
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
            image, // Main image
            images: JSON.stringify(images), // All images as JSON
            // Do NOT assign directly yet
            assignedUserId: null,
            assignedDate: null,
            // Save initial info if user not found (for future linking)
            initialPinfl: !targetUser && assignedPINFL ? assignedPINFL : null,
            initialOwner: !targetUser && assignedTo ? assignedTo : null,
            initialRole: !targetUser && assignedRole ? assignedRole : null
        };

        const item = await prisma.item.create({
            data: itemData
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

        // If Target User found, CREATE REQUEST
        if (targetUser) {
            await prisma.request.create({
                data: {
                    type: 'assignment',
                    status: 'pending_accountant', // Admin created -> Needs Accountant Approval
                    itemId: item.id,
                    requesterId: req.user.id,
                    targetUserId: targetUser.id,
                    description: `Yangi jihoz yaratildi va biriktirildi. (PINFL: ${targetUser.pinfl})`
                }
            });
            // We can return a specific message saying request created
        }

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
            name, model, serialNumber, inn, orderNumber, category, subCategory,
            price, quantity, purchaseDate, status, condition,
            building, location, department, assignedUserId, assignedPINFL, assignedRole, assignedTo,
            existingImages // JSON string or array of strings of OLD images to keep
        } = req.body;

        const dataToUpdate = {
            name, model, serialNumber, inn, orderNumber, category, subCategory,
            price: price ? parseFloat(price) : undefined,
            quantity: quantity ? parseInt(quantity) : undefined,
            purchaseDate, status, condition,
            building, location, department
        };

        // IMAGE HANDLING
        // 1. Get existing images from request (frontend should send what is kept)
        let finalImages = [];
        if (existingImages) {
            try {
                // If it's a string (JSON), parse it. If array, use it.
                finalImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
                if (!Array.isArray(finalImages)) finalImages = [finalImages];
            } catch (e) {
                // if simple string
                finalImages = [existingImages];
            }
        }

        // 2. Add NEW files
        if (req.files && req.files.length > 0) {
            const newImagePaths = req.files.map(file => `/uploads/${file.filename}`);
            finalImages = [...finalImages, ...newImagePaths];
        } else if (req.file) {
            finalImages.push(`/uploads/${req.file.filename}`);
        }

        // 3. Update fields if we have a final list
        if (finalImages.length > 0) {
            dataToUpdate.images = JSON.stringify(finalImages);
            dataToUpdate.image = finalImages[0]; // Main image is first one
        } else {
            // If existingImages was empty AND no new files, does it mean "Delete All"?
            // Or does it mean "No Change"?
            // Usually if existingImages is explicit (even empty), we update. 
            // If undefined, we might skip.
            // Let's assume if 'existingImages' field is present in body (even empty), we treat it as the new state.
            if (existingImages !== undefined) {
                dataToUpdate.images = "[]";
                dataToUpdate.image = null;
            }
        }

        // Handle Assignment Logic by PINFL or ID
        if (assignedPINFL) {
            // Check if user exists with this PINFL
            const targetUser = await prisma.user.findFirst({ where: { pinfl: assignedPINFL } });

            if (targetUser) {
                // User found -> Reassign
                dataToUpdate.assignedUserId = targetUser.id;
                dataToUpdate.assignedDate = new Date();
                // Clear initial fields if assigned to real user
                dataToUpdate.initialPinfl = null;
                dataToUpdate.initialOwner = null;
                dataToUpdate.initialRole = null;

                // SPECIAL FIX: If assignedRole is provided, UPDATE the user's position!
                if (assignedRole) {
                    await prisma.user.update({
                        where: { id: targetUser.id },
                        data: { position: assignedRole }
                    });
                }
            } else {
                // User NOT found -> Unassign from current user (if any) and store PINFL/Role/Name
                dataToUpdate.assignedUserId = null;
                dataToUpdate.assignedDate = null;
                dataToUpdate.initialPinfl = assignedPINFL;
                dataToUpdate.initialOwner = assignedTo; // Save Name
                dataToUpdate.initialRole = assignedRole; // Save Role
            }
        } else if (assignedUserId !== undefined) {
            // Fallback to explicit ID assignment logic if PINFL not provided/priority
            if (assignedUserId === 'null' || assignedUserId === null || assignedUserId === "") {
                dataToUpdate.assignedUserId = null;
                dataToUpdate.assignedDate = null;
            } else {
                dataToUpdate.assignedUserId = parseInt(assignedUserId);
                dataToUpdate.assignedDate = new Date();
            }
        } else {
            // No assignment logic triggered (no PINFL, no ID change)
            // Check for undefined to allow clearing values if sent as empty string (though validation requires them, this is safer)
            if (assignedTo !== undefined) dataToUpdate.initialOwner = assignedTo;
            if (assignedRole !== undefined) dataToUpdate.initialRole = assignedRole;
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
        const itemId = parseInt(req.params.id);

        // Delete associated requests first (manual cascade to be safe)
        await prisma.request.deleteMany({
            where: { itemId: itemId }
        });

        await prisma.item.delete({
            where: { id: itemId }
        });

        // Log delete
        await prisma.log.create({
            data: {
                action: 'delete',
                details: `Item deleted ID: ${req.params.id}`,
                userId: req.user.id
            }
        });

        // RESET ID SEQUENCE IF TABLE IS EMPTY
        const count = await prisma.item.count();
        if (count === 0) {
            try {
                await prisma.$executeRawUnsafe("DELETE FROM sqlite_sequence WHERE name='Item'");
            } catch (e) {
                console.error("Failed to reset sequence:", e);
            }
        }

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

        // 1. Gather all PINFLs from the file to fetch users efficiently
        const pinflsFromFile = new Set();
        data.forEach(row => {
            // Helper to get value case-insensitively
            const getVal = (keys) => {
                for (let k of keys) {
                    if (row[k] !== undefined) return row[k];
                }
                return null;
            };
            // Assume PINFL is in 'JSHSHIR' or 'PINFL' column
            const pinfl = getVal(['JSHSHIR', 'PINFL', 'pinfl', 'jshshir']);
            if (pinfl) pinflsFromFile.add(String(pinfl).replace(/\D/g, ''));
        });

        // 2. Fetch existing users with these PINFLs
        const existingUsers = await prisma.user.findMany({
            where: {
                pinfl: { in: Array.from(pinflsFromFile) }
            },
            select: { id: true, pinfl: true, name: true }
        });

        const userMap = new Map(); // pinfl -> userObject
        existingUsers.forEach(u => {
            if (u.pinfl) userMap.set(u.pinfl, u);
        });

        const itemsToCreate = [];

        for (const row of data) {
            const getVal = (keys) => {
                for (let k of keys) {
                    if (row[k] !== undefined) return row[k];
                }
                return null;
            };

            const name = getVal(['Nomi', 'Name', 'Jihoz nomi', 'name']);
            if (!name) continue;

            const statusRaw = getVal(['Holati', 'Status', 'status']) || 'working';
            let status = 'working';
            const s = String(statusRaw).toLowerCase();
            if (s.includes('ta\'mir') || s.includes('repair')) status = 'repair';
            else if (s.includes('chiqarilgan') || s.includes('write')) status = 'written-off';
            else if (s.includes('buzilgan') || s.includes('broken')) status = 'broken';

            // Get Owner Info
            const pinflRaw = getVal(['JSHSHIR', 'PINFL', 'pinfl', 'jshshir']);
            const pinfl = pinflRaw ? String(pinflRaw).replace(/\D/g, '') : null;
            const ownerName = getVal(['Ega', 'Owner', 'F.I.SH', 'FIO', 'fullname']) || getVal(['Mas\'ul', 'Responsible']);

            let assignedUserId = null;
            let assignedDate = null;
            let initialOwner = null;
            let initialPinfl = null;

            if (pinfl && userMap.has(pinfl)) {
                // User found! Assign item.
                assignedUserId = userMap.get(pinfl).id;
                assignedDate = new Date();
            } else {
                // User NOT found
                if (ownerName) initialOwner = String(ownerName);
                if (pinfl) initialPinfl = String(pinfl);
            }

            itemsToCreate.push({
                name: String(name),
                model: String(getVal(['Model', 'model']) || ''),
                serialNumber: getVal(['Seriya', 'Serial', 'Seriya raqami', 'serial', 'serialNumber']) ? String(getVal(['Seriya', 'Serial', 'Seriya raqami', 'serial', 'serialNumber'])) : null,
                inn: getVal(['INN', 'Inn', 'inn']) ? String(getVal(['INN', 'Inn', 'inn'])) : null,
                orderNumber: getVal(['OrderNumber', 'orderNumber', 'Invertar raqami', 'Invertar']) ? String(getVal(['OrderNumber', 'orderNumber', 'Invertar raqami', 'Invertar'])) : null,
                category: String(getVal(['Kategoriya', 'Category', 'category']) || 'Boshqa'),
                subCategory: String(getVal(['Subkategoriya', 'SubCategory']) || ''),
                price: parseFloat(String(getVal(['Narx', 'Price', 'Narxi', 'price']) || '0').replace(/[^0-9.]/g, '')),
                quantity: parseInt(String(getVal(['Soni', 'Quantity', 'quantity']) || '1')),
                purchaseDate: String(getVal(['Xarid sanasi', 'Purchase Date', 'purchaseDate']) || ''),
                building: String(getVal(['Bino', 'Building', 'building']) || ''),
                location: String(getVal(['Joylashuv', 'Location', 'location']) || 'Ombor'),
                department: String(getVal(['Bo\'lim', 'Department', 'department']) || ''),
                status: status,
                assignedUserId,
                assignedDate,
                initialOwner,
                initialPinfl
            });
        }

        if (itemsToCreate.length > 0) {
            // Deduplication logic (same as before)
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

            const uniqueFileItems = [...Array.from(uniqueFileItemsMap.values()), ...itemsWithoutSerial];
            const serials = uniqueFileItems.map(item => item.serialNumber).filter(s => s);

            const existingItems = await prisma.item.findMany({
                where: { serialNumber: { in: serials } },
                select: { serialNumber: true }
            });

            const existingSerials = new Set(existingItems.map(i => i.serialNumber));
            const newItems = uniqueFileItems.filter(item => !item.serialNumber || !existingSerials.has(item.serialNumber));

            if (newItems.length > 0) {
                await prisma.item.createMany({
                    data: newItems
                });

                await prisma.log.create({
                    data: {
                        action: 'import',
                        details: `Imported ${newItems.length} items from Excel.`,
                        userId: req.user.id
                    }
                });
            }

            fs.unlinkSync(req.file.path);

            return res.json({
                message: `${newItems.length} ta yangi jihoz yuklandi! (${itemsToCreate.length - newItems.length} ta dublikat tashlab ketildi)`
            });
        }
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error(error);
        res.status(500).json({ message: 'Import xatoligi: ' + error.message });
    }
};



// @desc    Delete multiple items
// @route   POST /api/items/delete-many
// @access  Private/Admin
const deleteManyItems = async (req, res) => {
    try {
        const { ids } = req.body; // Array of item IDs to delete

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "O'chirish uchun jihozlar tanlanmagan" });
        }

        // Optional: Check if any items are assigned before deleting?
        // For now, let's allow deleting unassigned items primarily.
        // Or we can just try to delete and Prisma will throw if there are strict foreign key constraints (like active Requests).
        // Let's safe delete: only delete if NOT assigned? Or just let admin force delete.
        // Admin power: Force delete.

        // However, if we delete an item that has a 'request', cascade might fail or be set.
        // Let's assume on-delete cascade or simple delete is fine.

        const deleted = await prisma.item.deleteMany({
            where: {
                id: { in: ids } // Correct filtering
            }
        });

        // Log
        await prisma.log.create({
            data: {
                action: 'bulk_delete',
                details: `${deleted.count} ta jihoz o'chirildi (Ommaviy)`,
                userId: req.user.id
            }
        });

        // RESET ID SEQUENCE IF TABLE IS EMPTY
        const count = await prisma.item.count();
        if (count === 0) {
            try {
                await prisma.$executeRawUnsafe("DELETE FROM sqlite_sequence WHERE name='Item'");
            } catch (e) {
                console.error("Failed to reset sequence:", e);
            }
        }

        res.json({ message: `${deleted.count} ta jihoz o'chirildi` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "O'chirishda xatolik: " + error.message });
    }
};

module.exports = { getItems, getItemById, createItem, updateItem, deleteItem, importItems, deleteManyItems };
