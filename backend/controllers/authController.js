
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

// ==========================================
// REGISTER USER
// ==========================================
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, phone, role } = req.body;

    // Required field validation
    if (!name || !email || !password) {
        throw new AppError(
            "Name, email and password are required.",
            400
        );
    }

    // Data type validation
    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        throw new AppError("Invalid registration data.", 400);
    }

    // Name validation
    if (name.trim().length < 2 || name.trim().length > 50) {
        throw new AppError(
            "Name must be between 2 and 50 characters.",
            400
        );
    }

    // Email validation
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
        throw new AppError(
            "Please provide a valid email address.",
            400
        );
    }

    // Password validation
    if (password.length < 8) {
        throw new AppError(
            "Password must be at least 8 characters long.",
            400
        );
    }

    // Phone validation
    if (phone !== undefined && typeof phone !== "string") {
        throw new AppError("Invalid phone number.", 400);
    }

    // Public registration roles
    const allowedRoles = ["donor", "recipient", "ngo"];
    const selectedRole = role || "donor";

    if (
        typeof selectedRole !== "string" ||
        !allowedRoles.includes(selectedRole)
    ) {
        throw new AppError("Invalid registration role.", 400);
    }

    // Check existing email
    const existingUser = await User.findOne({
        email: normalizedEmail
    });

    if (existingUser) {
        throw new AppError(
            "An account with this email already exists.",
            409
        );
    }

    // Create user
    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        phone: phone ? phone.trim() : "",
        role: selectedRole
    });

    const token = generateToken(user._id);

    res.status(201).json({
        success: true,
        message: "Account registered successfully.",
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        }
    });
});

// ==========================================
// LOGIN USER
// ==========================================
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError(
            "Email and password are required.",
            400
        );
    }

    if (
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        throw new AppError("Invalid login data.", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Password is select:false in User model
    const user = await User.findOne({
        email: normalizedEmail
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
        throw new AppError(
            "Invalid email or password.",
            401
        );
    }

    if (!user.isActive) {
        throw new AppError(
            "Your account has been deactivated.",
            403
        );
    }

    const token = generateToken(user._id);

    res.status(200).json({
        success: true,
        message: "Login successful.",
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        }
    });
});

// ==========================================
// GET LOGGED-IN USER PROFILE
// ==========================================
const getMe = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone,
            role: req.user.role,
            profileImage: req.user.profileImage,
            address: req.user.address
        }
    });
});

// ==========================================
// LOGOUT USER
// ==========================================
const logoutUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: "Logout successful. Please remove the token from the client."
    });
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
    logoutUser
};
