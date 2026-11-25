
const express = require("express");
const router = express.Router();

const {
    getDonorDashboard,
    getRecipientDashboard,
    getNgoDashboard,
    getAdminDashboard
} = require("../controllers/dashboardController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.use(protect);

router.get("/donor", authorize("donor"), getDonorDashboard);

router.get("/recipient", authorize("recipient"), getRecipientDashboard);

router.get("/ngo", authorize("ngo"), getNgoDashboard);

router.get("/admin", authorize("admin"), getAdminDashboard);

module.exports = router;
