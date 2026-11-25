

const NgoProfile = require("../models/NgoProfile");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const Notification = require("../models/Notification");

// ==========================================
// REGISTER NGO PROFILE
// ==========================================
const registerNgo = asyncHandler(async (req, res) => {
    const {
        organizationName,
        registrationNumber,
        description,
        documents,
        serviceAreas
    } = req.body;

    // Required field validation
    if (
        typeof organizationName !== "string" ||
        !organizationName.trim() ||
        typeof registrationNumber !== "string" ||
        !registrationNumber.trim()
    ) {
        throw new AppError(
            "Valid organization name and registration number are required.",
            400
        );
    }

    // Organization name validation
    if (organizationName.trim().length > 150) {
        throw new AppError(
            "Organization name cannot exceed 150 characters.",
            400
        );
    }

    // Normalize registration number
    const normalizedRegistrationNumber = registrationNumber
        .trim()
        .toUpperCase();

    // Description validation
    if (
        description !== undefined &&
        (
            typeof description !== "string" ||
            description.length > 1000
        )
    ) {
        throw new AppError(
            "Description must be a valid string with a maximum of 1000 characters.",
            400
        );
    }

    // Documents validation
    if (documents !== undefined && !Array.isArray(documents)) {
        throw new AppError("Documents must be an array.", 400);
    }

    // Service areas validation
    if (serviceAreas !== undefined && !Array.isArray(serviceAreas)) {
        throw new AppError("Service areas must be an array.", 400);
    }

    // Check existing NGO profile or registration number
    const existingNgo = await NgoProfile.findOne({
        $or: [
            { userId: req.user._id },
            { registrationNumber: normalizedRegistrationNumber }
        ]
    });

    if (existingNgo) {
        throw new AppError(
            "NGO profile or registration number already exists.",
            409
        );
    }

    // Create NGO profile
    const ngo = await NgoProfile.create({
        userId: req.user._id,
        organizationName: organizationName.trim(),
        registrationNumber: normalizedRegistrationNumber,
        description: description ? description.trim() : "",
        documents: documents || [],
        serviceAreas: serviceAreas || []
    });

    res.status(201).json({
        success: true,
        message: "NGO profile submitted successfully.",
        ngo
    });
});

// ==========================================
// GET OWN NGO PROFILE
// ==========================================
const getMyNgoProfile = asyncHandler(async (req, res) => {
    const ngo = await NgoProfile.findOne({
        userId: req.user._id
    });

    if (!ngo) {
        throw new AppError("NGO profile not found.", 404);
    }

    res.status(200).json({
        success: true,
        ngo
    });
});

// ==========================================
// ADMIN: GET ALL NGO PROFILES
// ==========================================
const getAllNgos = asyncHandler(async (req, res) => {
    const ngos = await NgoProfile.find()
        .populate("userId", "name email isActive")
        .populate("verifiedBy", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        totalNgos: ngos.length,
        ngos
    });
});

// ==========================================
// ADMIN: VERIFY OR REJECT NGO
// ==========================================
const updateNgoVerification = asyncHandler(async (req, res) => {
    const { verificationStatus } = req.body;

    // Validate verification status
    if (
        typeof verificationStatus !== "string" ||
        !["VERIFIED", "REJECTED"].includes(verificationStatus)
    ) {
        throw new AppError(
            "Status must be VERIFIED or REJECTED.",
            400
        );
    }

    // Find NGO profile
    const ngo = await NgoProfile.findById(req.params.id);

    if (!ngo) {
        throw new AppError("NGO profile not found.", 404);
    }

    // Prevent repeated verification
    if (ngo.verificationStatus !== "PENDING") {
        throw new AppError(
            "This NGO has already been reviewed.",
            409
        );
    }

    // Update verification details
    ngo.verificationStatus = verificationStatus;
    ngo.verifiedBy = req.user._id;
    ngo.verifiedAt = new Date();

    await ngo.save();

    // Notify NGO user
    await Notification.create({
        userId: ngo.userId,
        title: verificationStatus === "VERIFIED"
            ? "NGO Verification Successful"
            : "NGO Verification Rejected",
        message: verificationStatus === "VERIFIED"
            ? "Congratulations! Your NGO has been verified by HelpHub Admin."
            : "Your NGO verification has been rejected. Please contact the administrator for details.",
        type: "NGO_VERIFICATION",
        relatedId: ngo._id
    });

    res.status(200).json({
        success: true,
        message: `NGO ${verificationStatus.toLowerCase()} successfully.`,
        ngo
    });
});

// ==========================================
// EXPORT CONTROLLERS
// ==========================================
module.exports = {
    registerNgo,
    getMyNgoProfile,
    getAllNgos,
    updateNgoVerification
};

