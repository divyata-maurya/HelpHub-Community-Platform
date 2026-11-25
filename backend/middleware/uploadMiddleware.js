
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const AppError = require("../utils/AppError");

// Upload directory
const uploadDirectory = path.join(
    __dirname,
    "../uploads/donations"
);

// Create directory automatically if it does not exist
fs.mkdirSync(uploadDirectory, { recursive: true });

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            `${Date.now()}-${crypto.randomBytes(8).toString("hex")}` +
            path.extname(file.originalname).toLowerCase();

        cb(null, uniqueName);
    }
});

// Allow only supported image types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
    new AppError("Only JPG, PNG and WEBP images are allowed.", 400),
    false
);
    }
};

// Multer configuration
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB per image
        files: 5
    }
});

// Upload up to 5 donation images
const uploadDonationImages = upload.array("images", 5);

module.exports = {
    upload,
    uploadDonationImages
};
