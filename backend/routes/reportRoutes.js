
const express = require("express");
const router = express.Router();

const {
    createReport,
    getMyReports,
    getAllReports,
    reviewReport
} = require("../controllers/reportController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.use(protect);

// User routes
router.post("/", createReport);
router.get("/my-reports", getMyReports);

// Admin routes
router.get("/", authorize("admin"), getAllReports);
router.patch("/:id/review", authorize("admin"), reviewReport);

module.exports = router;
