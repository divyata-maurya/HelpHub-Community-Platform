
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const createAdmin = async () => {
    try {
        const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } =
            process.env;

        if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
            throw new Error(
                "Please configure ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env"
            );
        }

        if (ADMIN_PASSWORD.length < 8) {
            throw new Error("Admin password must be at least 8 characters.");
        }

        await mongoose.connect(MONGO_URI);

        const email = ADMIN_EMAIL.trim().toLowerCase();

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            if (existingUser.role === "admin") {
                console.log("An admin account with this email already exists.");
                return;
            }

            throw new Error(
                "This email already belongs to another account. Use a new email."
            );
        }

        const admin = await User.create({
            name: ADMIN_NAME.trim(),
            email,
            password: ADMIN_PASSWORD,
            role: "admin"
        });

        console.log("Admin account created successfully.");
        console.log("Admin Email:", admin.email);

    } catch (error) {
        console.error("Admin creation failed:", error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
};

createAdmin();
