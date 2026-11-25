
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError(
            "Authentication required. Please log in.",
            401
        );
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        throw new AppError("Invalid authentication token.", 401);
    }

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            throw new AppError(
                "Invalid or expired token. Please log in again.",
                401
            );
        }

        throw error;
    }

    const user = await User.findById(decoded.id);

    if (!user) {
        throw new AppError(
            "User associated with this token no longer exists.",
            401
        );
    }

    if (!user.isActive) {
        throw new AppError(
            "Your account has been deactivated.",
            403
        );
    }

    req.user = user;

    next();
});

module.exports = { protect };
