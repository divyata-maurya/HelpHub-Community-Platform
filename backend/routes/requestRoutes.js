
const express = require("express");
const router = express.Router();

const {
    createRequest,
    getMyRequests,
    getReceivedRequests,
    reviewRequest,
    cancelRequest,
    markHandedOver,
    confirmReceipt
} = require("../controllers/requestController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.use(protect);

// Recipient and NGO
router.post("/", authorize("recipient", "ngo"), createRequest);
router.get("/my-requests", authorize("recipient", "ngo"), getMyRequests);
router.patch("/:id/cancel", authorize("recipient", "ngo"), cancelRequest);
router.patch("/:id/confirm-receipt", authorize("recipient", "ngo"), confirmReceipt);

// Donor
router.get("/received", authorize("donor"), getReceivedRequests);
router.patch("/:id/review", authorize("donor"), reviewRequest);
router.patch("/:id/handed-over", authorize("donor"), markHandedOver);

module.exports = router;
