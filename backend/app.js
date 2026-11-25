const errorMiddleware = require("./middleware/errorMiddleware");
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const path = require("path");
const donationRoutes = require("./routes/donationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const requestRoutes = require("./routes/requestRoutes");
const ngoRoutes = require("./routes/ngoRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));


// Welcome Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to HelpHub API"
    });
});

// Health Check Route
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "HelpHub Server is running",
        environment: process.env.NODE_ENV
    });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/v1/donations", donationRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/requests", requestRoutes);
app.use("/api/v1/ngos", ngoRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

// Centralized Error Handler (must be last)
app.use(errorMiddleware);
module.exports = app;
