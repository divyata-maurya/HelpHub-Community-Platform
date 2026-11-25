const express = require("express");

const {
    getPendingDonations,
    approveDonation,
    rejectDonation
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.get("/donations/pending", getPendingDonations);

router.patch("/donations/:id/approve", approveDonation);

router.patch("/donations/:id/reject", rejectDonation);

module.exports = router;