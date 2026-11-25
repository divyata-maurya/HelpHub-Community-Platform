
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const resetAdminPassword = async () => {
    try {
        const { ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } = process.env;

        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
            throw new Error(
                "ADMIN_EMAIL and ADMIN_PASSWORD must be configured in .env"
            );
        }

        if (ADMIN_PASSWORD.length < 8) {
            throw new Error("Password must be at least 8 characters.");
        }

        await mongoose.connect(MONGO_URI);

        const email = ADMIN_EMAIL.trim().toLowerCase();

        const admin = await User.findOne({
            email,
            role: "admin"
        });

        if (!admin) {
            throw new Error("Admin account not found.");
        }

        // Assigning through save() triggers the password hashing hook.
        admin.password = ADMIN_PASSWORD;

        await admin.save();

        console.log("Admin password reset successfully.");
        console.log("Admin Email:", admin.email);

    } catch (error) {
        console.error("Password reset failed:", error.message);
        process.exitCode = 1;

    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
};

resetAdminPassword();
