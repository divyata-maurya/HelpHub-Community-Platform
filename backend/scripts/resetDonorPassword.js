
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const resetDonorPassword = async () => {
    try {
        const { DONOR_EMAIL, DONOR_PASSWORD, MONGO_URI } = process.env;

        if (!DONOR_EMAIL || !DONOR_PASSWORD || !MONGO_URI) {
            throw new Error("DONOR_EMAIL, DONOR_PASSWORD and MONGO_URI are required.");
        }

        if (DONOR_PASSWORD.length < 8) {
            throw new Error("Password must be at least 8 characters.");
        }

        await mongoose.connect(MONGO_URI);

        const donor = await User.findOne({
            email: DONOR_EMAIL.trim().toLowerCase(),
            role: "donor"
        });

        if (!donor) {
            throw new Error("Donor account not found.");
        }

        donor.password = DONOR_PASSWORD;
        await donor.save();

        console.log("Donor password reset successfully.");
        console.log("Donor Email:", donor.email);

    } catch (error) {
        console.error("Password reset failed:", error.message);
        process.exitCode = 1;

    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
};

resetDonorPassword();
