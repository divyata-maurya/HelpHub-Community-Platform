
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        // User who submitted the report
        reporterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Reporter ID is required"]
        },

        // Type of reported target
        targetType: {
            type: String,
            enum: ["Donation", "User"],
            required: [true, "Target type is required"]
        },

        // ID of reported donation or user
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, "Target ID is required"]
        },

        // Reason for reporting
        reason: {
            type: String,
            enum: [
                "FRAUD",
                "INAPPROPRIATE_CONTENT",
                "MISLEADING_INFORMATION",
                "SUSPICIOUS_ACTIVITY",
                "PROHIBITED_ITEM",
                "OTHER"
            ],
            required: [true, "Report reason is required"]
        },

        // Additional explanation
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        // Report review status
        status: {
            type: String,
            enum: [
                "PENDING",
                "UNDER_REVIEW",
                "RESOLVED",
                "DISMISSED"
            ],
            default: "PENDING"
        },

        // Admin who reviewed the report
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Indexes
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });

const Report = mongoose.models.Report ||
    mongoose.model("Report", reportSchema);

module.exports = Report;
