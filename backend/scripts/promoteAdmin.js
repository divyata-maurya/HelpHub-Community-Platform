
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const promoteAdmin = async () => {
    try {
        const email = "adminhelp@helphub.com";

        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOne({ email });

        if (!user) {
            throw new Error("User account not found.");
        }

        user.role = "admin";
        await user.save();

        console.log("User successfully promoted to Admin!");
        console.log("Email:", user.email);
        console.log("Role:", user.role);

    } catch (error) {
        console.error("Admin promotion failed:", error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
};

promoteAdmin();
