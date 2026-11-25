
const mongoose = require("mongoose");

// Donation Schema
const donationSchema = new mongoose.Schema(
    {
        // Donor Reference
        donorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Donor ID is required"]
        },

        // Basic Donation Information
        title: {
            type: String,
            required: [true, "Donation title is required"],
            trim: true,
            minlength: 3,
            maxlength: 100
        },

        description: {
            type: String,
            required: [true, "Donation description is required"],
            trim: true,
            maxlength: 1000
        },

        // Donation Category
        category: {
            type: String,
            required: [true, "Donation category is required"],
            enum: [
                "Food & Groceries",
                "Clothes & Accessories",
                "Books & Education",
                "Furniture & Household",
                "Electronics",
                "Toys & Sports",
                "Personal Care & Hygiene",
                "Baby Care",
                "Mobility & Accessibility",
                "Other"
            ]
        },

        // Quantity Information
        quantity: {
            type: Number,
            required: [true, "Total quantity is required"],
            min: [1, "Quantity must be at least 1"]
        },

        availableQuantity: {
            type: Number,
            required: [true, "Available quantity is required"],
            min: [0, "Available quantity cannot be negative"],
            validate: {
                validator: function (value) {
                    return value <= this.quantity;
                },
                message: "Available quantity cannot exceed total quantity"
            }
        },

        unit: {
            type: String,
            required: [true, "Donation unit is required"],
            trim: true,
            maxlength: 30
        },

        // Item Condition
        condition: {
            type: String,
            required: [true, "Item condition is required"],
            enum: ["New", "Like New", "Good", "Fair"]
        },

        // Donation Images
        images: {
            type: [String],
            default: []
        },

        // Pickup Location
        location: {
            address: {
                type: String,
                trim: true,
                default: ""
            },

            city: {
                type: String,
                required: [true, "City is required"],
                trim: true
            },

            state: {
                type: String,
                required: [true, "State is required"],
                trim: true
            },

            country: {
                type: String,
                required: [true, "Country is required"],
                trim: true,
                default: "India"
            },

            postalCode: {
                type: String,
                trim: true,
                default: ""
            }
        },

        // Optional Expiry Date
        expiryDate: {
            type: Date,
            default: null
        },

        // Donation Availability Status
        status: {
            type: String,
            enum: [
                "PENDING_REVIEW",
                "AVAILABLE",
                "UNAVAILABLE",
                "EXPIRED",
                "REJECTED"
            ],
            default: "AVAILABLE"
        }
    },
    {
        timestamps: true
    }
);

// Indexes for Faster Searching
donationSchema.index({ category: 1, status: 1 });
donationSchema.index({ "location.city": 1 });
donationSchema.index({ donorId: 1 });
donationSchema.index({ title: "text", description: "text" });

// Export Donation Model
const Donation = mongoose.models.Donation ||
    mongoose.model("Donation", donationSchema);

module.exports = Donation;
