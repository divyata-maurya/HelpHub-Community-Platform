
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to MongoDB first
        await connectDB();

        // Start Express server
        app.listen(PORT, () => {
            console.log(`HelpHub Server running on port ${PORT}`);
            console.log(`URL: http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Server Startup Failed:", error.message);
        process.exit(1);
    }
};

startServer();
