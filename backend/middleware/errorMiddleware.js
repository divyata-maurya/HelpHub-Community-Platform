
const AppError = require("../utils/AppError");

const errorMiddleware = (err, req, res, next) => {
    let error = err;

    // Handle invalid MongoDB ObjectId
    if (err.name === "CastError") {
        error = new AppError("Invalid resource ID.", 400);
    }

    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors)
            .map((item) => item.message);

        error = new AppError(messages.join(". "), 400);
    }

    // Handle duplicate MongoDB fields
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || "Field";

        error = new AppError(
            `${field} already exists.`,
            409
        );
    }

    // Handle invalid JWT
    if (err.name === "JsonWebTokenError") {
        error = new AppError("Invalid authentication token.", 401);
    }

    // Handle expired JWT
    if (err.name === "TokenExpiredError") {
        error = new AppError("Authentication token has expired.", 401);
    }

    // Handle file upload errors
    if (err.name === "MulterError") {
        error = new AppError(err.message, 400);
    }

    const statusCode =
    error.statusCode >= 400 && error.statusCode <= 599
        ? error.statusCode
        : 500;

    res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500 && process.env.NODE_ENV === "production"
                ? "Internal server error."
                : error.message || "Something went wrong.",
        ...(process.env.NODE_ENV === "development" && {
            stack: err.stack
        })
    });
};

module.exports = errorMiddleware;
