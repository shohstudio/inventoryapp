const prisma = require('../utils/prisma');
// const cloudinary = require('../utils/cloudinary'); // Removed as we use local storage now

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
            isAssigned, // 'unassigned', 'pending', 'all'
            inventoryStatus,
            inventoryStartDate,
            inventoryType // Add inventoryType filter
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        let where = {};

        // Search Filter
        if (search) {
            where.OR = [
                { name: { contains: search } }, // SQLite is case-insensitive by default roughly, or basic
                { model: { contains: search } },
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
        if (inventoryType) where.inventoryType = inventoryType;

        // Filter by Inventory Status (Passed / Not Passed)
        // Filter by Inventory Status (Passed / Not Passed)
        console.log("Filter Params:", { inventoryStatus, inventoryStartDate });

        if (inventoryStatus && inventoryStartDate) {
            const startDate = new Date(inventoryStartDate);
            console.log("Parsed Start Date:", startDate);

            if (inventoryStatus === 'passed') {
                where.lastCheckedAt = {
                    gte: startDate // Checked AFTER start date (as Date object)
                };
            } else if (inventoryStatus === 'not_passed') {
                where.OR = [
                    { lastCheckedAt: null },
                    { lastCheckedAt: { lt: startDate } } // Checked BEFORE start date
                ];
            }
        }

        console.log("Final Where Clause:", JSON.stringify(where, null, 2));

        if (assignedUserId) {
            where.assignedUserId = parseInt(assignedUserId);
        }

        // Warehouse Specific Filters
        if (isAssigned === 'unassigned') {
            where.assignedUserId = null;
            // Also ensure no manual handover
            where.initialOwner = null;

            // Also ensure no active requests if strict "Available in Warehouse"
            where.requests = {
                none: {
                    status: { in: ['pending_accountant', 'pending_employee'] }
                }
            };
        } else if (isAssigned === 'assigned') {
            // New filter for "Berilgan" tab
            where.OR = [
                { assignedUserId: { not: null } },
                { initialOwner: { not: null } }
            ];
        } else if (isAssigned === 'pending') {
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
                        select: { name: true, employeeId: true, position: true }
                    },
                    requests: {
                        where: {
                            status: { in: ['pending_accountant', 'pending_employee'] }
                        },
                        select: {
                            id: true,
                            status: true,
                            targetUser: { select: { name: true, employeeId: true, position: true } }
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
                },
                requests: {
                    where: {
                        status: { in: ['pending_accountant', 'pending_employee'] }
                    },
                    select: {
                        id: true,
                        status: true,
                        targetUser: { select: { name: true, pinfl: true, position: true } }
                    }
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
            name, model, inn, orderNumber, category, subCategory,
            price, quantity, purchaseDate, status, condition,
            building, location, department, assignedUserId,
            assignedEmployeeId, assignedTo, assignedRole, unit // Extract new fields
        } = req.body;

        // MULTI-IMAGE & PDF HANDLING
        let image = null;
        let images = [];
        let contractPdf = null;
        let inventoryType = req.body.inventoryType || 'warehouse'; // Default to warehouse

        if (req.files && req.files.length > 0) {
            // Filter images vs PDFs
            const imageFiles = req.files.filter(f => f.mimetype.startsWith('image/'));
            const pdfFiles = req.files.filter(f => f.mimetype === 'application/pdf');

            if (imageFiles.length > 0) {
                images = imageFiles.map(file => `/uploads/${file.filename}`);
                image = images[0]; // Set first image as Main Image
            }

            if (pdfFiles.length > 0) {
                contractPdf = `/uploads/${pdfFiles[0].filename}`;
            }
        }
        // Check if User exists by Employee ID or assignedUserId
        let targetUser = null;
        if (assignedUserId && !isNaN(parseInt(assignedUserId))) {
            targetUser = await prisma.user.findUnique({ where: { id: parseInt(assignedUserId) } });
        } else if (assignedEmployeeId) {
            targetUser = await prisma.user.findUnique({ where: { employeeId: assignedEmployeeId } });
        }

        const itemData = {
            name,
            model: model || null,
            inn: (inn === "" || !inn) ? null : inn,
            orderNumber: (orderNumber === "" || !orderNumber) ? null : orderNumber,
            category: category || null,
            subCategory: subCategory || null,
            price: (price && !isNaN(parseFloat(price))) ? parseFloat(price) : 0,
            quantity: (quantity && !isNaN(parseFloat(quantity))) ? parseFloat(quantity) : 1,
            unit: unit || "dona",
            initialQuantity: (quantity && !isNaN(parseFloat(quantity))) ? parseFloat(quantity) : 1,
            purchaseDate,
            status: status || "working",
            condition,
            building,
            location,
            department,
            image, // Main image
            images: JSON.stringify(images),
            contractPdf,
            inventoryType,
            assignedUserId: targetUser ? targetUser.id : null,
            assignedDate: targetUser ? new Date() : null,
            initialEmployeeId: !targetUser && assignedEmployeeId ? assignedEmployeeId : null,
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
                    status: 'pending_accountant',
                    itemId: item.id,
                    requesterId: req.user.id,
                    targetUserId: targetUser.id,
                    description: `Yangi jihoz yaratildi va biriktirildi. (ID: ${targetUser.employeeId || targetUser.id})`
                }
            });
        }

        res.status(201).json(item);
    } catch (error) {
        console.error(error);
        if (error.code === 'P2002' && error.meta?.target?.includes('inn')) {
            return res.status(400).json({ message: "Bunday INN raqamli jihoz allaqachon mavjud!" });
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
            name, model, inn, orderNumber, category, subCategory,
            price, quantity, purchaseDate, status, condition,
            building, location, department, assignedUserId, assignedEmployeeId, assignedRole, assignedTo,
            existingImages, // JSON string or array of strings of OLD images to keep
            initialOwner, initialRole, assignedDate, handoverQuantity, // Extract Handover fields directly
            inventoryType, // Allow updating inventory type
            unit // Extract unit
        } = req.body;

        const id = parseInt(req.params.id);
        const item = await prisma.item.findUnique({ where: { id } });

        if (!item) {
            return res.status(404).json({ message: "Jihoz topilmadi" });
        }

        const dataToUpdate = {
            name, model,
            inn: (inn === "" || inn === null) ? null : inn,
            orderNumber: (orderNumber === "" || orderNumber === null) ? null : orderNumber,
            category, subCategory,
            price: (price !== undefined && price !== "") ? (isNaN(parseFloat(price)) ? 0 : parseFloat(price)) : undefined,
            quantity: (quantity !== undefined && quantity !== "") ? (isNaN(parseFloat(quantity)) ? 1 : parseFloat(quantity)) : undefined,
            purchaseDate, status, condition,
            building, location, department,
            ...(inventoryType && { inventoryType }), // Only update if provided
            ...(unit && { unit }) // Only update if provided
        };

        // IMAGE & PDF HANDLING
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
            // Filter generic images (excluding specific named fields if needed, but usually images are just 'image' or 'images')
            const imageFiles = req.files.filter(f => f.mimetype.startsWith('image/') && f.fieldname !== 'handoverImage');

            // Filter generic PDFs (Contract) - EXCLUDE employeeReport
            const pdfFiles = req.files.filter(f => f.mimetype === 'application/pdf' && f.fieldname !== 'employeeReport');

            console.log("DEBUG UPDATE ITEM:", {
                files: req.files.map(f => ({ field: f.fieldname, mime: f.mimetype, name: f.filename })),
                pdfFilesCount: pdfFiles.length
            });

            const newImagePaths = imageFiles.map(file => `/uploads/${file.filename}`);
            finalImages = [...finalImages, ...newImagePaths];

            if (pdfFiles.length > 0) {
                // Only update contractPdf if a generic PDF (not report) is uploaded
                // Or if we have a specific 'contract' field name? Current frontend sends everything in 'file' or 'files' for generic updates?
                // Actually UserItemsModal etc don't seem to upload contract separately yet?
                // But if they did, we want to be safe.
                console.log("Updating Contract PDF to:", pdfFiles[0].filename);
                dataToUpdate.contractPdf = `/uploads/${pdfFiles[0].filename}`;
            }
        }



        // 3. Update fields if we have a final list
        if (finalImages.length > 0) {
            dataToUpdate.images = JSON.stringify(finalImages);
            dataToUpdate.image = finalImages[0]; // Main image is first one
        } else {
            // Keep existing images logic or clear
            if (existingImages !== undefined) {
                // If it was explicitly sent as something other than undefined (e.g. empty array string), clear it
                // BUT current logic: if existingImages sent as "[]", finalImages becomes [], so we enter here? No, length 0.
                dataToUpdate.images = "[]";
                dataToUpdate.image = null;
            }
        }

        // HANDOVER IMAGE HANDLING
        if (req.files && req.files.length > 0) {
            // Identify handover image by fieldname if possible, OR if Multer puts it in req.files array?
            // Multer `upload.array('images', 10)` puts everything in one array if field name matches 'images'.
            // BUT frontend sends: formData.append('handoverImage', file).
            // Middleware `upload.array('images', 10)` ONLY accepts field 'images'.
            // PROBLEM: We need to handle 'handoverImage' field.
            // SOLUTION: We should use `upload.any()` or `upload.fields([{ name: 'images', maxCount: 10 }, { name: 'handoverImage', maxCount: 1 }])` in route.
            // ACTION: I must check route first. If route is hardcoded to `upload.array('images')`, `handoverImage` will be rejected or ignored.
            // Let's assume I fix route in next step. Here I handle the file assuming it arrives.
            const handoverFile = req.files.find(f => f.fieldname === 'handoverImage');
            if (handoverFile) {
                dataToUpdate.handoverImage = `/uploads/${handoverFile.filename}`;
            }
            const reportFile = req.files.find(f => f.fieldname === 'employeeReport');
            if (reportFile) {
                dataToUpdate.employeeReport = `/uploads/${reportFile.filename}`;
            }
        }

        // Handle Assignment Logic by Employee ID or ID
        if (assignedEmployeeId) {
            // Check if user exists with this Employee ID
            const targetUser = await prisma.user.findUnique({ where: { employeeId: assignedEmployeeId } });

            if (targetUser) {
                // User found -> Reassign
                dataToUpdate.assignedUserId = targetUser.id;
                dataToUpdate.assignedDate = new Date();
                // Clear initial fields if assigned to real user
                dataToUpdate.initialEmployeeId = null;
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
                // User NOT found -> Unassign from current user (if any) and store ID/Role/Name
                dataToUpdate.assignedUserId = null;
                dataToUpdate.assignedDate = null;
                dataToUpdate.initialEmployeeId = assignedEmployeeId;
                dataToUpdate.initialOwner = assignedTo; // Save Name
                dataToUpdate.initialRole = assignedRole; // Save Role
            }
        } else if (assignedUserId !== undefined) {
            // Fallback to explicit ID assignment logic if Employee ID not provided/priority
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

            // Direct Handover Data Update (if sent explicitly)
            if (initialOwner !== undefined) dataToUpdate.initialOwner = initialOwner;
            if (initialRole !== undefined) dataToUpdate.initialRole = initialRole;
            if (assignedDate !== undefined) dataToUpdate.assignedDate = assignedDate ? new Date(assignedDate) : null;
        }

        // --- PARTIAL HANDOVER SPLIT LOGIC ---
        // If handoverQuantity is provided and it is LESS than current item quantity, we must SPLIT the item.
        if (initialOwner && handoverQuantity && parseFloat(handoverQuantity) < item.quantity) {
            const splitQty = parseFloat(handoverQuantity);
            const remainingQty = item.quantity - splitQty;

            // Fix for Legacy Data:
            // corrupted/default initialQuantity (e.g., 1) might be less than current item.quantity (e.g., 10).
            // If so, assume item.quantity IS the initial quantity of this batch.
            let validInitialQty = item.initialQuantity || item.quantity;
            if (validInitialQty < item.quantity) {
                validInitialQty = item.quantity;
            }

            // 1. Update ORIGINAL item: just reduce quantity, KEEP it in stock (unassigned)
            // We do NOT apply dataToUpdate (which has assignment info) to the original item.
            // Ensure initialQuantity remains as is (e.g., 10). If null, set it to pre-split quantity.
            await prisma.item.update({
                where: { id: parseInt(id) },
                data: {
                    quantity: remainingQty,
                    initialQuantity: validInitialQty
                }
            });

            // 2. Create NEW item: Copy strict fields from original, set quantity to splitQty, apply assignment
            // We need to parse images properly to copy them
            let newImages = item.images;

            // Prepare creation data based on original item
            const newItemData = {
                name: item.name,
                model: item.model,
                inn: item.inn,
                orderNumber: item.orderNumber,
                category: item.category,
                subCategory: item.subCategory,
                price: item.price,
                quantity: splitQty, // The handed over amount
                initialQuantity: validInitialQty, // Preserve the valid original batch size
                purchaseDate: item.purchaseDate,
                contractPdf: item.contractPdf, // Copy PDF
                image: item.image, // Copy main image
                status: item.status,
                condition: item.condition,
                inventoryType: item.inventoryType, // Fix: Copy inventoryType (e.g. 'tmj') matching original
                department: item.department, // Maybe updates?
                location: item.location,    // Maybe updates?

                // Apply Handover Data
                building: dataToUpdate.building || item.building, // Updated building
                initialOwner: dataToUpdate.initialOwner,
                initialRole: dataToUpdate.initialRole,
                initialEmployeeId: dataToUpdate.initialEmployeeId,
                assignedUserId: dataToUpdate.assignedUserId,
                assignedDate: dataToUpdate.assignedDate,

                // Images
                images: newImages,
                handoverImage: dataToUpdate.handoverImage // The proof image
            };

            const newItem = await prisma.item.create({
                data: newItemData
            });

            return res.json(newItem);
        }
        // --- END PARTIAL LOGIC ---

        const updatedItem = await prisma.item.update({
            where: { id: parseInt(req.params.id) },
            data: dataToUpdate
        });

        // Log update
        await prisma.log.create({
            data: {
                action: 'update',
                details: `Item updated: ${name}`,
                userId: req.user.id,
                itemId: updatedItem.id
            }
        });

        res.json(updatedItem);
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

        // 1. Gather all Employee IDs from the file to fetch users efficiently
        const employeeIdsFromFile = new Set();
        data.forEach(row => {
            // Helper to get value case-insensitively
            const getVal = (keys) => {
                for (let k of keys) {
                    if (row[k] !== undefined) return row[k];
                }
                return null;
            };
            // Assume Employee ID is in 'Employee ID', 'ID', 'Tabel' column
            const empId = getVal(['Employee ID', 'EmployeeID', 'ID', 'id', 'Tabel', 'tabel']);
            if (empId) employeeIdsFromFile.add(String(empId).trim());
        });

        // 2. Fetch existing users with these IDs
        const existingUsers = await prisma.user.findMany({
            where: {
                employeeId: { in: Array.from(employeeIdsFromFile) }
            },
            select: { id: true, employeeId: true, name: true }
        });

        const userMap = new Map(); // employeeId -> userObject
        existingUsers.forEach(u => {
            if (u.employeeId) userMap.set(u.employeeId, u);
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
            const empIdRaw = getVal(['Employee ID', 'EmployeeID', 'ID', 'id', 'Tabel', 'tabel']);
            const empId = empIdRaw ? String(empIdRaw).trim() : null;
            const ownerName = getVal(['Ega', 'Owner', 'F.I.SH', 'FIO', 'fullname']) || getVal(['Mas\'ul', 'Responsible']);

            let assignedUserId = null;
            let assignedDate = null;
            let initialOwner = null;
            let initialEmployeeId = null;

            if (empId && userMap.has(empId)) {
                // User found! Assign item.
                assignedUserId = userMap.get(empId).id;
                assignedDate = new Date();
            } else {
                // User NOT found
                if (ownerName) initialOwner = String(ownerName);
                if (empId) initialEmployeeId = String(empId);
            }

            itemsToCreate.push({
                name: String(name),
                model: String(getVal(['Model', 'model']) || ''),
                inn: getVal(['INN', 'Inn', 'inn', 'Inventar n', 'Inventar Nomer']) ? String(getVal(['INN', 'Inn', 'inn', 'Inventar n', 'Inventar Nomer'])) : null,
                orderNumber: getVal(['OrderNumber', 'orderNumber', 'Invertar raqami', 'Invertar', 'Order Number']) ? String(getVal(['OrderNumber', 'orderNumber', 'Invertar raqami', 'Invertar', 'Order Number'])) : null,
                category: String(getVal(['Kategoriya', 'Category', 'category']) || 'Boshqa'),
                subCategory: String(getVal(['Subkategoriya', 'SubCategory', 'Turi']) || ''),
                price: parseFloat(String(getVal(['Narx', 'Price', 'Narxi', 'price', 'Summa']) || '0').replace(/[^0-9.]/g, '')),
                quantity: parseInt(String(getVal(['Soni', 'Quantity', 'quantity', 'ta']) || '1')),
                purchaseDate: String(getVal(['Xarid sanasi', 'Purchase Date', 'purchaseDate', 'Yili']) || ''),
                building: String(getVal(['Bino', 'Building', 'building']) || ''),
                location: String(getVal(['Joylashuv', 'Location', 'location', 'Joylashuvi']) || 'Ombor'),
                department: String(getVal(['Bo\'lim', 'Department', 'department']) || ''),
                status: status,
                assignedUserId,
                assignedDate,
                initialOwner,
                initialEmployeeId,
                inventoryType: getVal(['Turi', 'Type', 'inventoryType'])?.toString().toLowerCase().trim() === 'tmj' ? 'tmj' : 'warehouse'
            });
        }

        if (itemsToCreate.length > 0) {
            // Simplified: Creation without deduplication on serialNumber
            await prisma.item.createMany({
                data: itemsToCreate
            });

            await prisma.log.create({
                data: {
                    action: 'import',
                    details: `Imported ${itemsToCreate.length} items from Excel.`,
                    userId: req.user.id
                }
            });

            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

            return res.json({
                message: `${itemsToCreate.length} ta yangi jihoz yuklandi!`
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

// @desc    Verify inventory item (scanned & checked)
// @route   POST /api/items/:id/verify-inventory
// @access  Private (Admin/Employee)
const verifyInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, department } = req.body;

        const item = await prisma.item.findUnique({ where: { id: parseInt(id) } });

        if (!item) {
            return res.status(404).json({ message: "Jihoz topilmadi" });
        }

        let updateData = {
            lastCheckedAt: new Date()
        };

        // Update status if provided
        if (status) {
            updateData.status = status;
        }

        // Update department if provided
        if (department) {
            updateData.department = department;
            // Also optionally update building if logic requires, but department is specific field now
            // If the schema has both, we update department. 
            // In schema: department String?
        }

        // If new images uploaded
        if (req.files && req.files.length > 0) {
            // Local file upload via Multer (already saved to server/uploads)

            // 1. Set main image to the FIRST one
            const mainFile = req.files[0];
            updateData.image = `/uploads/${mainFile.filename}`;

            // 2. Store ALL images in the images JSON array
            // Since we might want to KEEP existing images or REPLACE them?
            // Usually, a new verification might imply a fresh set of "current state" photos.
            // Let's replace the 'images' array with the new set for this verification event.
            // (Or we could append, but 'verify' usually means 'this is how it looks NOW')
            const imagePaths = req.files.map(f => `/uploads/${f.filename}`);
            updateData.images = JSON.stringify(imagePaths);
        }

        const updatedItem = await prisma.item.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        // Log
        await prisma.log.create({
            data: {
                action: 'inventory_check',
                details: JSON.stringify({
                    status: status || item.status,
                    notes: notes || '',
                    imageUpdated: !!(req.files && req.files.length > 0)
                }),
                userId: req.user.id,
                itemId: updatedItem.id
            }
        });

        res.json(updatedItem);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Tasdiqlashda xatolik: " + error.message });
    }
};

module.exports = { getItems, getItemById, createItem, updateItem, deleteItem, importItems, deleteManyItems, verifyInventoryItem };
