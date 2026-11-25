
const User = require("../models/User");
const Donation = require("../models/Donation");
const Request = require("../models/Request");
const NgoProfile = require("../models/NgoProfile");
const Report = require("../models/Report");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

// ==========================================
// DONOR DASHBOARD
// ==========================================
const getDonorDashboard = asyncHandler(async (req, res) => {
    const donorId = req.user._id;

    const [
        totalDonations,
        availableDonations,
        completedRequests,
        receivedRequests,
        pendingRequests
    ] = await Promise.all([
        Donation.countDocuments({ donorId }),
        Donation.countDocuments({ donorId, status: "AVAILABLE" }),
        Request.countDocuments({ donorId, status: "COMPLETED" }),
        Request.countDocuments({ donorId }),
        Request.countDocuments({ donorId, status: "PENDING" })
    ]);

    res.status(200).json({
        success: true,
        dashboard: {
            totalDonations,
            availableDonations,
            completedRequests,
            receivedRequests,
            pendingRequests
        }
    });
});

// ==========================================
// RECIPIENT DASHBOARD
// ==========================================
const getRecipientDashboard = asyncHandler(async (req, res) => {
    const requesterId = req.user._id;

    const [
        totalRequests,
        pendingRequests,
        acceptedRequests,
        completedRequests,
        rejectedRequests
    ] = await Promise.all([
        Request.countDocuments({ requesterId }),
        Request.countDocuments({ requesterId, status: "PENDING" }),
        Request.countDocuments({ requesterId, status: "ACCEPTED" }),
        Request.countDocuments({ requesterId, status: "COMPLETED" }),
        Request.countDocuments({ requesterId, status: "REJECTED" })
    ]);

    res.status(200).json({
        success: true,
        dashboard: {
            totalRequests,
            pendingRequests,
            acceptedRequests,
            completedRequests,
            rejectedRequests
        }
    });
});

// ==========================================
// NGO DASHBOARD
// ==========================================
const getNgoDashboard = asyncHandler(async (req, res) => {
    const ngo = await NgoProfile.findOne({
        userId: req.user._id
    });

    if (!ngo) {
        throw new AppError("NGO profile not found.", 404);
    }

    const requesterId = req.user._id;

    const [
        totalRequests,
        pendingRequests,
        acceptedRequests,
        completedRequests,
        rejectedRequests
    ] = await Promise.all([
        Request.countDocuments({ requesterId }),
        Request.countDocuments({ requesterId, status: "PENDING" }),
        Request.countDocuments({ requesterId, status: "ACCEPTED" }),
        Request.countDocuments({ requesterId, status: "COMPLETED" }),
        Request.countDocuments({ requesterId, status: "REJECTED" })
    ]);

    res.status(200).json({
        success: true,
        dashboard: {
            organizationName: ngo.organizationName,
            verificationStatus: ngo.verificationStatus,
            totalRequests,
            pendingRequests,
            acceptedRequests,
            completedRequests,
            rejectedRequests
        }
    });
});

// ==========================================
// ADMIN DASHBOARD
// ==========================================
const getAdminDashboard = asyncHandler(async (req, res) => {
    const [
        totalUsers,
        totalDonors,
        totalRecipients,
        totalNgos,
        inactiveUsers,
        totalDonations,
        availableDonations,
        pendingDonations,
        totalRequests,
        pendingRequests,
        completedRequests,
        pendingNgos,
        verifiedNgos,
        pendingReports
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "donor" }),
        User.countDocuments({ role: "recipient" }),
        User.countDocuments({ role: "ngo" }),
        User.countDocuments({ isActive: false }),
        Donation.countDocuments(),
        Donation.countDocuments({ status: "AVAILABLE" }),
        Donation.countDocuments({ status: "PENDING_REVIEW" }),
        Request.countDocuments(),
        Request.countDocuments({ status: "PENDING" }),
        Request.countDocuments({ status: "COMPLETED" }),
        NgoProfile.countDocuments({ verificationStatus: "PENDING" }),
        NgoProfile.countDocuments({ verificationStatus: "VERIFIED" }),
        Report.countDocuments({ status: "PENDING" })
    ]);

    res.status(200).json({
        success: true,
        dashboard: {
            totalUsers,
            totalDonors,
            totalRecipients,
            totalNgos,
            inactiveUsers,
            totalDonations,
            availableDonations,
            pendingDonations,
            totalRequests,
            pendingRequests,
            completedRequests,
            pendingNgos,
            verifiedNgos,
            pendingReports
        }
    });
});

// ==========================================
// EXPORT CONTROLLERS
// ==========================================
module.exports = {
    getDonorDashboard,
    getRecipientDashboard,
    getNgoDashboard,
    getAdminDashboard
};
