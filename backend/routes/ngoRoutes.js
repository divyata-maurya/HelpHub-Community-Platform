
const express = require("express");
const router = express.Router();

const {
    registerNgo,
    getMyNgoProfile,
    getAllNgos,
    updateNgoVerification
} = require("../controllers/ngoController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.use(protect);

router.post("/profile", authorize("ngo"), registerNgo);
router.get("/profile", authorize("ngo"), getMyNgoProfile);

router.get("/", authorize("admin"), getAllNgos);
router.patch("/:id/verification", authorize("admin"), updateNgoVerification);

module.exports = router;
