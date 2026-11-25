
const mongoose = require("mongoose");

const ngoProfileSchema = new mongoose.Schema(
    {
        // NGO account reference
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
            unique: true
        },

        // Organization information
        organizationName: {
            type: String,
            required: [true, "Organization name is required"],
            trim: true,
            maxlength: 150
        },

        registrationNumber: {
            type: String,
            required: [true, "Registration number is required"],
            trim: true,
            unique: true
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        // Verification documents
        documents: {
            type: [String],
            default: []
        },

        // Areas served by the NGO
        serviceAreas: {
            type: [String],
            default: []
        },

        // NGO verification status
        verificationStatus: {
            type: String,
            enum: [
                "PENDING",
                "VERIFIED",
                "REJECTED"
            ],
            default: "PENDING"
        },

        // Admin who verified the NGO
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        verifiedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Indexes
ngoProfileSchema.index({ verificationStatus: 1 });

const NgoProfile = mongoose.models.NgoProfile ||
    mongoose.model("NgoProfile", ngoProfileSchema);

module.exports = NgoProfile;
