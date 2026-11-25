const express = require("express");

const {
    createDonation,
    getAllDonations,
    getDonationById,
    updateDonation,
    deleteDonation,
    getMyDonations
} = require("../controllers/donationController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const { uploadDonationImages } = require("../middleware/uploadMiddleware");

const router = express.Router();

// All donation routes require login
router.use(protect);

// Donor's own donations
router.get("/my-donations", authorize("donor"), getMyDonations);

// Browse donations
router.get("/", getAllDonations);

// Create donation (Donor only)
router.post(
    "/",
    authorize("donor"),
    uploadDonationImages,
    createDonation
);

// View one donation
router.get("/:id", getDonationById);

// Update donation
router.put(
    "/:id",
    authorize("donor", "admin"),
    uploadDonationImages,
    updateDonation
);

// Delete donation
router.delete("/:id", authorize("donor", "admin"), deleteDonation);

module.exports = router;