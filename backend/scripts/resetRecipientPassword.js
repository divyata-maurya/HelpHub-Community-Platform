
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function resetRecipientPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const recipient = await User.findOne({
            email: "testrecipient@gmail.com",
            role: "recipient"
        });

        if (!recipient) throw new Error("Recipient account not found.");

        recipient.password = "Recipient@123";
        await recipient.save();

        console.log("Recipient password reset successfully.");
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

resetRecipientPassword();
