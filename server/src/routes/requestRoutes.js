const express = require('express');
const router = express.Router();
const { createRequest, getRequests, updateRequestStatus } = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .post(protect, createRequest)
    .get(protect, getRequests);

router.route('/:id')
    // Enable single file upload with field name 'file'
    .put(protect, upload.single('file'), updateRequestStatus);

module.exports = router;
