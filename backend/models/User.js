
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// User Schema
const userSchema = new mongoose.Schema(
    {
        // Basic Information
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: 2,
            maxlength: 50
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 8,
            select: false
        },

        phone: {
            type: String,
            trim: true,
            default: ""
        },

        // User Role
        role: {
            type: String,
            enum: ["donor", "recipient", "ngo", "admin"],
            required: true,
            default: "recipient"
        },

        // Profile Information
        profileImage: {
            type: String,
            default: ""
        },

        address: {
            type: String,
            trim: true,
            default: ""
        },

        // Account Status
        isActive: {
            type: Boolean,
            default: true
        },

        isEmailVerified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// Password Hashing Before Saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 12);
});

// Password Comparison Method
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Export User Model
const User = mongoose.models.User ||
    mongoose.model("User", userSchema);

module.exports = User;
