
const Report = require("../models/Report");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");
const Donation = require("../models/Donation");
const User = require("../models/User");

// User submits a report
const createReport = asyncHandler(async (req, res) => {
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
        throw new AppError(
            "Target type, target ID and reason are required.",
            400
        );
    }

    if (!["Donation", "User"].includes(targetType)) {
        throw new AppError("Invalid target type.", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
    throw new AppError("Invalid target ID.", 400);
}

const TargetModel = targetType === "Donation" ? Donation : User;

const targetExists = await TargetModel.exists({ _id: targetId });

if (!targetExists) {
    throw new AppError("Reported target not found.", 404);
}

if (targetType === "User" && targetId === req.user._id.toString()) {
    throw new AppError("You cannot report your own account.", 400);
}
    const report = await Report.create({
        reporterId: req.user._id,
        targetType,
        targetId,
        reason,
        description
    });

    res.status(201).json({
        success: true,
        message: "Report submitted successfully.",
        report
    });
});

// User views their own reports
const getMyReports = asyncHandler(async (req, res) => {
    const reports = await Report.find({
        reporterId: req.user._id
    }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        totalReports: reports.length,
        reports
    });
});


const getAllReports = asyncHandler(async (req, res) => {
    const { status } = req.query;

    const allowedStatuses = [
        "PENDING",
        "UNDER_REVIEW",
        "RESOLVED",
        "DISMISSED"
    ];

    if (status && !allowedStatuses.includes(status)) {
        throw new AppError("Invalid report status filter.", 400);
    }

    const filter = {};

    if (status) {
        filter.status = status;
    }

    const reports = await Report.find(filter)
        .populate("reporterId", "name email")
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        totalReports: reports.length,
        reports
    });
});


// Admin reviews a report
const reviewReport = asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!["UNDER_REVIEW", "RESOLVED", "DISMISSED"].includes(status)) {
        throw new AppError("Invalid report status.", 400);
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
        throw new AppError("Report not found.", 404);
    }
    if (["RESOLVED", "DISMISSED"].includes(report.status)) {
    throw new AppError(
        "This report has already been closed.",
        400
    );
}

    report.status = status;
    report.reviewedBy = req.user._id;

    await report.save();

    res.status(200).json({
        success: true,
        message: "Report status updated successfully.",
        report
    });
});

module.exports = {
    createReport,
    getMyReports,
    getAllReports,
    reviewReport
};
