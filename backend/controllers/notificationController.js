
const Notification = require("../models/Notification");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

// Get logged-in user's notifications
const getMyNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({
        userId: req.user._id
    }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        totalNotifications: notifications.length,
        notifications
    });
});

// Mark notification as read
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        {
            _id: req.params.id,
            userId: req.user._id
        },
        { isRead: true },
        { new: true, runValidators: true }
    );

    if (!notification) {
        throw new AppError("Notification not found.", 404);
    }

    res.status(200).json({
        success: true,
        message: "Notification marked as read.",
        notification
    });
});

// Mark all notifications as read
const markAllAsRead = asyncHandler(async (req, res) => {
    const result = await Notification.updateMany(
        { userId: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );

    res.status(200).json({
        success: true,
        message: "All notifications marked as read.",
        modifiedCount: result.modifiedCount
    });
});

// Delete notification
const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!notification) {
        throw new AppError("Notification not found.", 404);
    }

    res.status(200).json({
        success: true,
        message: "Notification deleted successfully."
    });
});

module.exports = {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
