
const Donation = require("../models/Donation");
const Request = require("../models/Request");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const Notification = require("../models/Notification");
const NgoProfile = require("../models/NgoProfile");

// ==========================================
// CREATE REQUEST (RECIPIENT / NGO)
// ==========================================
const createRequest = asyncHandler(async (req, res) => {
    const { donationId, requestedQuantity, message } = req.body;

    const quantity = Number(requestedQuantity);

    if (!donationId || !Number.isInteger(quantity) || quantity <= 0) {
        throw new AppError("Please provide a valid donation ID and quantity.", 400);
    }
    // Only verified NGOs can request donations
if (req.user.role === "ngo") {
    const ngo = await NgoProfile.findOne({
        userId: req.user._id
    });

    if (!ngo || ngo.verificationStatus !== "VERIFIED") {
        throw new AppError(
            "Your NGO must be verified before requesting donations.",
            403
        );
    }
}
    const donation = await Donation.findById(donationId);

    if (!donation || donation.status !== "AVAILABLE") {
        throw new AppError("Donation is not available.", 404);
    }

    if (donation.donorId.toString() === req.user._id.toString()) {
        throw new AppError("You cannot request your own donation.", 400);
    }

    if (quantity > donation.availableQuantity) {
        throw new AppError("Requested quantity exceeds available quantity.", 400);
    }

    const existingRequest = await Request.findOne({
        donationId,
        requesterId: req.user._id,
        status: { $in: ["PENDING", "ACCEPTED"] }
    });

    if (existingRequest) {
        throw new AppError("You already have an active request for this donation.", 400);
    }

    const request = await Request.create({
        donationId,
        requesterId: req.user._id,
        donorId: donation.donorId,
        requestedQuantity: quantity,
        message: message || ""
    });

    await Notification.create({
    userId: donation.donorId,
    title: "New Donation Request",
    message: `${req.user.name} has requested ${requestedQuantity} item(s) from your donation: ${donation.title}.`,
    type: "REQUEST",
    relatedId: request._id
});

    res.status(201).json({
        success: true,
        message: "Donation request submitted successfully.",
        request
    });
});

// ==========================================
// GET MY REQUESTS (RECIPIENT / NGO)
// ==========================================
const getMyRequests = asyncHandler(async (req, res) => {
    const requests = await Request.find({
        requesterId: req.user._id
    })
        .populate("donationId")
        .populate("donorId", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        totalRequests: requests.length,
        requests
    });
});

// ==========================================
// GET REQUESTS RECEIVED (DONOR)
// ==========================================
const getReceivedRequests = asyncHandler(async (req, res) => {
    const requests = await Request.find({
        donorId: req.user._id
    })
        .populate("donationId", "title category availableQuantity unit")
        .populate("requesterId", "name email phone")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        totalRequests: requests.length,
        requests
    });
});

// ==========================================
// ACCEPT / REJECT REQUEST (DONOR)
// ==========================================
const reviewRequest = asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!["ACCEPTED", "REJECTED"].includes(status)) {
        throw new AppError("Status must be ACCEPTED or REJECTED.", 400);
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
        throw new AppError("Request not found.", 404);
    }

    if (request.donorId.toString() !== req.user._id.toString()) {
        throw new AppError("You are not authorized to review this request.", 403);
    }

    if (request.status !== "PENDING") {
        throw new AppError("This request has already been reviewed.", 400);
    }

    if (status === "ACCEPTED") {
        // Reserve the requested quantity atomically.
        const donation = await Donation.findOneAndUpdate(
            {
                _id: request.donationId,
                status: "AVAILABLE",
                availableQuantity: { $gte: request.requestedQuantity }
            },
            {
                $inc: { availableQuantity: -request.requestedQuantity }
            },
            { new: true }
        );

        if (!donation) {
            throw new AppError("Not enough donation quantity is available.", 400);
        }

        if (donation.availableQuantity === 0) {
            donation.status = "UNAVAILABLE";
            await donation.save();
        }
    }

    const updatedRequest = await Request.findOneAndUpdate(
        { _id: request._id, status: "PENDING" },
        {
            $set: {
                status,
                reviewedAt: new Date()
            }
        },
        { new: true }
    );

    // Restore stock if another review changed the request meanwhile.
    if (!updatedRequest && status === "ACCEPTED") {
        await Donation.findByIdAndUpdate(request.donationId, {
            $inc: { availableQuantity: request.requestedQuantity },
            $set: { status: "AVAILABLE" }
        });

        throw new AppError("Request could not be updated. Please try again.", 409);
    }
    await Notification.create({
    userId: request.requesterId,
    title: status === "ACCEPTED"
        ? "Donation Request Accepted"
        : "Donation Request Rejected",
    message: status === "ACCEPTED"
        ? `Your request for ${request.requestedQuantity} item(s) has been accepted by the donor.`
        : `Your request for ${request.requestedQuantity} item(s) has been rejected by the donor.`,
    type: "REQUEST",
    relatedId: request._id
});

    res.status(200).json({
        success: true,
        message: `Request ${status.toLowerCase()} successfully.`,
        request: updatedRequest
    });
});

// ==========================================
// CANCEL REQUEST (REQUESTER)
// ==========================================

const cancelRequest = asyncHandler(async (req, res) => {
    const request = await Request.findOne({
        _id: req.params.id,
        requesterId: req.user._id
    });

    if (!request) {
        throw new AppError("Request not found.", 404);
    }

    if (!["PENDING", "ACCEPTED"].includes(request.status)) {
        throw new AppError("This request cannot be cancelled.", 400);
    }

    const previousStatus = request.status;

const updatedRequest = await Request.findOneAndUpdate(
    {
        _id: request._id,
        requesterId: req.user._id,
        status: previousStatus
    },
    {
        $set: { status: "CANCELLED" }
    },
    { new: true }
);

if (!updatedRequest) {
    throw new AppError(
        "Request status changed. Please try again.",
        409
    );
}

if (previousStatus === "ACCEPTED") {
    const donation = await Donation.findByIdAndUpdate(
        request.donationId,
        {
            $inc: {
                availableQuantity: request.requestedQuantity
            },
            $set: { status: "AVAILABLE" }
        },
        { new: true }
    );

    if (!donation) {
        throw new AppError("Associated donation not found.", 404);
    }
}

    res.status(200).json({
        success: true,
        message: "Request cancelled successfully.",
        request: updatedRequest
    });
});

// ==========================================
// MARK HANDED OVER (DONOR)
// ==========================================
const markHandedOver = asyncHandler(async (req, res) => {
    const request = await Request.findOneAndUpdate(
        {
            _id: req.params.id,
            donorId: req.user._id,
            status: "ACCEPTED"
        },
        {
            $set: {
                status: "HANDED_OVER",
                handoverAt: new Date()
            }
        },
        { new: true }
    );

    if (!request) {
        throw new AppError("Accepted request not found.", 404);
    }

    await Notification.create({
    userId: request.requesterId,
    title: "Donation Handed Over",
    message: "The donor has marked your requested donation as handed over. Please confirm receipt.",
    type: "HANDOVER",
    relatedId: request._id
});

    res.status(200).json({
        success: true,
        message: "Donation marked as handed over.",
        request
    });
});

// ==========================================
// CONFIRM RECEIPT (RECIPIENT / NGO)
// ==========================================
const confirmReceipt = asyncHandler(async (req, res) => {
    const request = await Request.findOneAndUpdate(
        {
            _id: req.params.id,
            requesterId: req.user._id,
            status: "HANDED_OVER"
        },
        {
            $set: {
                status: "COMPLETED",
                completedAt: new Date()
            }
        },
        { new: true }
    );

    if (!request) {
        throw new AppError("Handed-over request not found.", 404);
    }

    await Notification.create({
    userId: request.donorId,
    title: "Donation Successfully Completed",
    message: "The recipient has confirmed receipt of your donation. Thank you for helping!",
    type: "COMPLETION",
    relatedId: request._id
});

    res.status(200).json({
        success: true,
        message: "Donation receipt confirmed successfully.",
        request
    });
});

module.exports = {
    createRequest,
    getMyRequests,
    getReceivedRequests,
    reviewRequest,
    cancelRequest,
    markHandedOver,
    confirmReceipt
};
