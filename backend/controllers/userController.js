const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

// ==========================================
// UPDATE OWN PROFILE
// ==========================================
const updateProfile = asyncHandler(async (req, res, next) => {
    const { name, phone, address, profileImage } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
        return next(new AppError("User not found.", 404));
    }

    // Only permitted profile fields can be updated
    if (name !== undefined) {
    if (
        typeof name !== "string" ||
        !name.trim() ||
        name.trim().length < 2 ||
        name.trim().length > 50
    ) {
        throw new AppError(
            "Name must be between 2 and 50 characters.",
            400
        );
    }

    user.name = name.trim();
}

    if (phone !== undefined) {
    if (typeof phone !== "string" || phone.length > 20) {
        throw new AppError("Invalid phone number.", 400);
    }
    user.phone = phone.trim();
}

if (address !== undefined) {
    if (typeof address !== "string" || address.length > 300) {
        throw new AppError("Invalid address.", 400);
    }
    user.address = address.trim();
}
   if (profileImage !== undefined) {
    if (typeof profileImage !== "string" || profileImage.length > 500) {
        throw new AppError("Invalid profile image value.", 400);
    }
    user.profileImage = profileImage.trim();
}

    await user.save();

    res.status(200).json({
        success: true,
        message: "Profile updated successfully.",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            profileImage: user.profileImage,
            address: user.address
        }
    });
});

// ==========================================
// CHANGE PASSWORD
// ==========================================
const changePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return next(
            new AppError("Current password and new password are required.", 400)
        );
    }
    if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string"
) {
    throw new AppError("Invalid password format.", 400);
}

    if (newPassword.length < 8) {
        return next(
            new AppError("New password must be at least 8 characters long.", 400)
        );
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
        return next(new AppError("User not found.", 404));
    }

    const isPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
        return next(new AppError("Current password is incorrect.", 401));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Password changed successfully. Please log in again."
    });
});

// ==========================================
// GET ALL USERS (ADMIN ONLY)
// ==========================================
const getAllUsers = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.role) {
        const allowedRoles = ["donor", "recipient", "ngo", "admin"];

        if (!allowedRoles.includes(req.query.role)) {
            throw new AppError("Invalid role filter.", 400);
        }

        filter.role = req.query.role;
    }

    if (req.query.isActive !== undefined) {
        if (!["true", "false"].includes(req.query.isActive)) {
            throw new AppError("isActive must be true or false.", 400);
        }

        filter.isActive = req.query.isActive === "true";
    }

    const [users, totalUsers] = await Promise.all([
        User.find(filter)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),

        User.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        users
    });
});

// ==========================================
// GET SINGLE USER (ADMIN ONLY)
// ==========================================
const getUserById = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
        return next(new AppError("User not found.", 404));
    }

    res.status(200).json({
        success: true,
        user
    });
});

// ==========================================
// ACTIVATE / DEACTIVATE USER (ADMIN ONLY)
// ==========================================
const updateUserStatus = asyncHandler(async (req, res, next) => {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
        return next(
            new AppError("Please provide isActive as true or false.", 400)
        );
    }

    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError("User not found.", 404));
    }

    if (user._id.toString() === req.user._id.toString()) {
        return next(
            new AppError("You cannot deactivate your own admin account.", 400)
        );
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
        success: true,
        message: isActive
            ? "User account activated successfully."
            : "User account deactivated successfully.",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        }
    });
});

module.exports = {
    updateProfile,
    changePassword,
    getAllUsers,
    getUserById,
    updateUserStatus
};