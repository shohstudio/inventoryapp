const prisma = require('../utils/prisma');

// @desc    Create a new request
// @route   POST /api/requests
// @access  Private
const createRequest = async (req, res) => {
    try {
        const { itemId, targetUserId, type, description, quantity } = req.body;

        // Validation
        if (!itemId || !type) {
            return res.status(400).json({ message: "Jihoz va tur tanlanishi shart" });
        }

        // Determine initial status based on type
        let status = 'pending_accountant';
        if (type === 'exit') {
            status = 'pending_guard'; // Or approval flow
        }

        const request = await prisma.request.create({
            data: {
                type,
                status,
                description,
                item: { connect: { id: parseInt(itemId) } },
                requester: { connect: { id: req.user.id } },
                ...(targetUserId && { targetUser: { connect: { id: parseInt(targetUserId) } } })
            }
        });

        // Log action
        await prisma.log.create({
            data: {
                action: `So'rov yaratildi: ${type}`,
                userId: req.user.id,
                itemId: parseInt(itemId),
                details: `Status: ${status}`
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
        console.log("GET /api/requests called by user:", req.user?.id, req.user?.role);

        let where = {};
        const { status } = req.query;

        if (status) where.status = status;

        // Role based filtering
        if (req.user && req.user.role === 'employee') {
            // Employee sees requests where they are target or requester
            where.OR = [
                { targetUserId: req.user.id },
                { requesterId: req.user.id }
            ];
        }

        // Ensure Request table exists implicitly by catching error specifically? 
        // No, just log error.

        const requests = await prisma.request.findMany({
            where,
            include: {
                item: true,
                requester: { select: { name: true, role: true } },
                targetUser: { select: { name: true, pinfl: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(requests);
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
        const { status, signature } = req.body;

        const request = await prisma.request.findUnique({ where: { id: parseInt(id) } });

        if (!request) {
            return res.status(404).json({ message: "So'rov topilmadi" });
        }

        // Logic for state transitions
        const updatedRequest = await prisma.request.update({
            where: { id: parseInt(id) },
            data: {
                status,
                ...(signature && { accountantSignature: signature })
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
