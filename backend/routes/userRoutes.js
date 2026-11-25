const express = require("express");

const {
    updateProfile,
    changePassword,
    getAllUsers,
    getUserById,
    updateUserStatus
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// All user routes require authentication
router.use(protect);

// Logged-in user's own account
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);

// Admin-only user management
router.get("/", authorize("admin"), getAllUsers);
router.get("/:id", authorize("admin"), getUserById);
router.patch("/:id/status", authorize("admin"), updateUserStatus);

module.exports = router;