
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        // Donation being requested
        donationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Donation",
            required: [true, "Donation ID is required"]
        },

        // User who submitted the request
        requesterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Requester ID is required"]
        },

        // Owner of the donation
        donorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Donor ID is required"]
        },

        // Requested quantity
        requestedQuantity: {
            type: Number,
            required: [true, "Requested quantity is required"],
            min: [1, "Requested quantity must be at least 1"]
        },

        // Optional message from requester
        message: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        },

        // Request status
        status: {
            type: String,
            enum: [
                "PENDING",
                "ACCEPTED",
                "REJECTED",
                "CANCELLED",
                "HANDED_OVER",
                "COMPLETED"
            ],
            default: "PENDING"
        },

        // Request review information
        reviewedAt: {
            type: Date,
            default: null
        },

        // Handover information
        handoverAt: {
            type: Date,
            default: null
        },

        // Completion information
        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Indexes
requestSchema.index({ donationId: 1, status: 1 });
requestSchema.index({ requesterId: 1, createdAt: -1 });
requestSchema.index({ donorId: 1, status: 1 });

const Request = mongoose.models.Request ||
    mongoose.model("Request", requestSchema);

module.exports = Request;
