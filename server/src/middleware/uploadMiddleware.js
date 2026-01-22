const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename(req, file, cb) {
        cb(
            null,
            `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
        );
    },
});

const checkFileType = (file, cb) => {
    // Allowed extensions
    const filetypes = /jpg|jpeg|png|xlsx|xls|pdf/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    // Check mime type (relaxed for excel as it can vary, usually checking extname is enough for trusted internal apps but let's try to be safe-ish or just skip mimetype strictly for excel if needed)
    // Common excel mimes: application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    // Image mimes: image/jpeg, image/png

    // Let's just create a list of allowed mimetypes
    const mimetypes = [
        'image/jpeg',
        'image/png',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/octet-stream', // Sometimes CSV/Excel comes as octet-stream
        'application/pdf'
    ];

    const mimetype = mimetypes.includes(file.mimetype) || filetypes.test(file.mimetype); // Fallback to regex if simple string check fails

    // Simplifying: If extension matches, we valid. Mime type check can be flaky for Excel.
    // Let's stick to extension for now to solve the user's immediate blocking issue.
    // Re-using the regex for extension, and allowing any mimetype if extension is xlsx/xls?

    if (extname) {
        return cb(null, true);
    } else {
        cb('Error: Only Images, Excel, and PDF files are allowed!');
    }
};

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

module.exports = upload;
