
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        // User receiving the notification
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"]
        },

        // Notification title
        title: {
            type: String,
            required: [true, "Notification title is required"],
            trim: true,
            maxlength: 100
        },

        // Notification message
        message: {
            type: String,
            required: [true, "Notification message is required"],
            trim: true,
            maxlength: 500
        },

        // Notification category
        type: {
            type: String,
            enum: [
                "DONATION",
                "REQUEST",
                "HANDOVER",
                "COMPLETION",
                "NGO_VERIFICATION",
                "ACCOUNT",
                "SYSTEM"
            ],
            required: true
        },

        // Related record ID, if applicable
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        // Read status
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// Index for user's notifications
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.models.Notification ||
    mongoose.model("Notification", notificationSchema);

module.exports = Notification;
