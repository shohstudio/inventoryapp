const prisma = require('../utils/prisma');

// @desc    Create a new request
// @route   POST /api/requests
// @access  Private
const createRequest = async (req, res) => {
    try {
        const { itemId, targetUserId, type, description, quantity, title, category, priority, image } = req.body;

        // Validation
        if (!type) {
            return res.status(400).json({ message: "So'rov turi tanlanishi shart" });
        }

        if (type !== 'issue' && !itemId) {
            return res.status(400).json({ message: "Jihoz tanlanishi shart" });
        }

        // Determine initial status based on type
        let status = req.body.status || 'pending_accountant';
        if (type === 'exit' && !req.body.status) {
            status = 'pending_accountant';
        }
        if (type === 'issue') {
            status = 'pending_admin'; // Issues go to admin/warehouseman
        }

        const requestData = {
            type,
            status,
            description,
            requester: { connect: { id: req.user.id } },
            ...(title && { title }),
            ...(category && { category }),
            ...(priority && { priority }),
            ...(image && { image }),
            ...(targetUserId && { targetUser: { connect: { id: parseInt(targetUserId) } } })
        };

        if (itemId) {
            requestData.item = { connect: { id: parseInt(itemId) } };
        }

        const request = await prisma.request.create({
            data: requestData
        });

        // Log action
        await prisma.log.create({
            data: {
                action: `So'rov yaratildi: ${type}`,
                userId: req.user.id,
                ...(itemId && { itemId: parseInt(itemId) }),
                details: `Status: ${status} ${title ? `| ${title}` : ''}`
            }
        });

        res.status(201).json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all requests (filtered by role)
// @route   GET /api/requests
// @access  Private
const getRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;

        console.log("GET /api/requests called by user:", req.user?.id, req.user?.role, "Page:", page);

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        let where = {};

        if (status) where.status = status;

        // Role based filtering
        if (req.user && req.user.role === 'employee') {
            // Employee sees requests where they are target or requester
            where.OR = [
                { targetUserId: req.user.id },
                { requesterId: req.user.id },
                { requesterId: req.user.id } // Add redundancy just in case, or simplify.
            ];
            // If searching for specific status, applied on top of OR
        }

        const [requests, total] = await prisma.$transaction([
            prisma.request.findMany({
                where,
                skip,
                take,
                include: {
                    item: {
                        include: {
                            assignedTo: {
                                select: { name: true, image: true }
                            }
                        }
                    },
                    requester: { select: { name: true, role: true, image: true } },
                    targetUser: { select: { name: true, pinfl: true, image: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.request.count({ where })
        ]);

        res.json({
            requests,
            metadata: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error("getRequests ERROR:", error);
        res.status(500).json({ message: "Server xatoligi: " + error.message });
    }
};

// @desc    Update request status (Approve/Reject/Complete)
// @route   PUT /api/requests/:id
// @access  Private
const updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, signature, description } = req.body;

        const request = await prisma.request.findUnique({ where: { id: parseInt(id) } });

        if (!request) {
            return res.status(404).json({ message: "So'rov topilmadi" });
        }

        // Logic for state transitions
        const updatedRequest = await prisma.request.update({
            where: { id: parseInt(id) },
            data: {
                status,
                ...(signature && { accountantSignature: signature }),
                ...(description && { description: description }), // Allow updating description (e.g. rejection reason)
                ...(req.file && { accountantDocument: `/uploads/${req.file.filename}` }) // Save uploaded file path
            }
        });

        // If Completed (Employee accepted), update Item assignment
        if (status === 'completed' && request.type === 'assignment') {
            if (request.targetUserId && request.itemId) {
                await prisma.item.update({
                    where: { id: request.itemId },
                    data: {
                        assignedUserId: request.targetUserId,
                        assignedDate: new Date(),
                        assignedDocument: request.accountantDocument, // Persist the basis document
                        status: 'working' // Active
                    }
                });
            }
        }

        // Log
        await prisma.log.create({
            data: {
                action: `So'rov yangilandi: ${status}`,
                userId: req.user.id,
                itemId: request.itemId,
                details: signature ? "Imzolandi" : "Status o'zgardi"
            }
        });

        res.json(updatedRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createRequest, getRequests, updateRequestStatus };
