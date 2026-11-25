
const Donation = require("../models/Donation");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

// ==========================================
// GET ALL PENDING DONATIONS
// ==========================================
const getPendingDonations = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const limit = Math.min(
        Math.max(parseInt(req.query.limit, 10) || 10, 1),
        100
    );

    const skip = (page - 1) * limit;

    const [donations, totalDonations] = await Promise.all([
        Donation.find({ status: "PENDING_REVIEW" })
            .populate("donorId", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),

        Donation.countDocuments({ status: "PENDING_REVIEW" })
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
// APPROVE DONATION
// ==========================================
const approveDonation = asyncHandler(async (req, res, next) => {
    const donation = await Donation.findOneAndUpdate(
        {
            _id: req.params.id,
            status: "PENDING_REVIEW"
        },
        {
            $set: { status: "AVAILABLE" }
        },
        {
            new: true,
            runValidators: true
        }
    ).populate("donorId", "name email");

    if (!donation) {
        const existingDonation = await Donation.findById(req.params.id);

        if (!existingDonation) {
            return next(new AppError("Donation not found.", 404));
        }

        return next(
            new AppError(
                "This donation is not pending review.",
                400
            )
        );
    }

    res.status(200).json({
        success: true,
        message: "Donation approved successfully.",
        donation
    });
});

// ==========================================
// REJECT DONATION
// ==========================================
const rejectDonation = asyncHandler(async (req, res, next) => {
    const donation = await Donation.findOneAndUpdate(
        {
            _id: req.params.id,
            status: "PENDING_REVIEW"
        },
        {
            $set: { status: "REJECTED" }
        },
        {
            new: true,
            runValidators: true
        }
    ).populate("donorId", "name email");

    if (!donation) {
        const existingDonation = await Donation.findById(req.params.id);

        if (!existingDonation) {
            return next(new AppError("Donation not found.", 404));
        }

        return next(
            new AppError(
                "This donation is not pending review.",
                400
            )
        );
    }

    res.status(200).json({
        success: true,
        message: "Donation rejected successfully.",
        donation
    });
});

module.exports = {
    getPendingDonations,
    approveDonation,
    rejectDonation
};
