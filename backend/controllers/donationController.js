const Donation = require("../models/Donation");
const Request = require("../models/Request");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const fs = require("fs");
const path = require("path");

const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
// ==========================================
// HELPER: REMOVE UPLOADED IMAGES
// ==========================================
const removeImages = (images = []) => {
    images.forEach((image) => {
        const filename = path.basename(image);
        const imagePath = path.join(
            __dirname,
            "../uploads/donations",
            filename
        );

        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    });
};

// ==========================================
// CREATE DONATION (DONOR ONLY)
// ==========================================
const createDonation = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        category,
        quantity,
        unit,
        condition,
        location,
        expiryDate
    } = req.body;

    if (
        !title ||
        !description ||
        !category ||
        quantity === undefined ||
        !unit ||
        !condition ||
        !location
    ) {
        throw new AppError("Please provide all required donation details.", 400);
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
        throw new AppError("Quantity must be a positive whole number.", 400);
    }

    let parsedLocation;

    try {
        parsedLocation =
            typeof location === "string" ? JSON.parse(location) : location;
    } catch {
        throw new AppError("Location must be valid JSON.", 400);
    }

    const images = (req.files || []).map(
        (file) => `/uploads/donations/${file.filename}`
    );

    const donation = await Donation.create({
        donorId: req.user._id,
        title: title.trim(),
        description: description.trim(),
        category,
        quantity: parsedQuantity,
        availableQuantity: parsedQuantity,
        unit,
        condition,
        images,
        location: parsedLocation,
        expiryDate: expiryDate || undefined,
        status: "PENDING_REVIEW"
    });

    res.status(201).json({
        success: true,
        message: "Donation submitted successfully. It is pending admin review.",
        donation
    });
});

// ==========================================
// GET ALL DONATIONS
// ==========================================
const getAllDonations = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
        Math.max(parseInt(req.query.limit, 10) || 10, 1),
        100
    );
    const skip = (page - 1) * limit;

    const filter = {};

    // Admin can view all statuses; other users see approved donations only.
    if (req.user.role !== "admin") {
        filter.status = "AVAILABLE";
        filter.availableQuantity = { $gt: 0 };
    } else if (req.query.status) {
        filter.status = req.query.status;
    }

    if (req.query.category) {
        filter.category = req.query.category;
    }

    if (req.query.condition) {
        filter.condition = req.query.condition;
    }

    if (req.query.city) {
    const city = escapeRegex(req.query.city);

    filter["location.city"] = {
        $regex: city,
        $options: "i"
    };
}

    if (req.query.search) {
    const search = escapeRegex(req.query.search);

    filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }
    ];
}

    const [donations, totalDonations] = await Promise.all([
        Donation.find(filter)
            .populate("donorId", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),

        Donation.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        totalDonations,
        currentPage: page,
        totalPages: Math.ceil(totalDonations / limit),
        donations
    });
});

// ==========================================
// GET SINGLE DONATION
// ==========================================
const getDonationById = asyncHandler(async (req, res, next) => {
    const donation = await Donation.findById(req.params.id)
        .populate("donorId", "name");

    if (!donation) {
        return next(new AppError("Donation not found.", 404));
    }

    const isOwner =
        donation.donorId._id.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (donation.status !== "AVAILABLE" && !isOwner && !isAdmin) {
        return next(new AppError("This donation is not available.", 404));
    }

    res.status(200).json({
        success: true,
        donation
    });
});

// ==========================================
// UPDATE OWN DONATION (DONOR / ADMIN)
// ==========================================
const updateDonation = asyncHandler(async (req, res, next) => {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
        return next(new AppError("Donation not found.", 404));
    }

    const isOwner =
        donation.donorId.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        return next(
            new AppError("You can only update your own donations.", 403)
        );
    }

    if (!["PENDING_REVIEW", "AVAILABLE"].includes(donation.status)) {
        return next(
            new AppError("This donation can no longer be edited.", 400)
        );
    }

    const allowedFields = [
        "title",
        "description",
        "category",
        "unit",
        "condition",
        "expiryDate"
    ];

    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            donation[field] =
                typeof req.body[field] === "string"
                    ? req.body[field].trim()
                    : req.body[field];
        }
    });

    if (req.body.location !== undefined) {
        try {
            donation.location =
                typeof req.body.location === "string"
                    ? JSON.parse(req.body.location)
                    : req.body.location;
        } catch {
            throw new AppError("Location must be valid JSON.", 400);
        }
    }

    const newImages = (req.files || []).map(
        (file) => `/uploads/donations/${file.filename}`
    );

    if (newImages.length > 0) {
        donation.images = [...(donation.images || []), ...newImages];
    }

    await donation.save();

    res.status(200).json({
        success: true,
        message: "Donation updated successfully.",
        donation
    });
});

// ==========================================
// DELETE OWN DONATION (DONOR / ADMIN)
// ==========================================
const deleteDonation = asyncHandler(async (req, res, next) => {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
        return next(new AppError("Donation not found.", 404));
    }

    const isOwner =
        donation.donorId.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        return next(
            new AppError("You can only delete your own donations.", 403)
        );
    }

    const existingRequests = await Request.countDocuments({
        donationId: donation._id
    });

    if (existingRequests > 0) {
        return next(
            new AppError(
                "This donation has requests and cannot be deleted. Mark it unavailable instead.",
                400
            )
        );
    }

    removeImages(donation.images);

    await donation.deleteOne();

    res.status(200).json({
        success: true,
        message: "Donation deleted successfully."
    });
});

// ==========================================
// GET MY DONATIONS (DONOR)
// ==========================================
const getMyDonations = asyncHandler(async (req, res) => {
    const donations = await Donation.find({
        donorId: req.user._id
    }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        totalDonations: donations.length,
        donations
    });
});

module.exports = {
    createDonation,
    getAllDonations,
    getDonationById,
    updateDonation,
    deleteDonation,
    getMyDonations
};