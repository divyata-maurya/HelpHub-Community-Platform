
const API_BASE_URL = window.HELPHUB_CONFIG.API_BASE_URL;

document.addEventListener("DOMContentLoaded", async () => {
    const token = sessionStorage.getItem("token");
    const user = JSON.parse(sessionStorage.getItem("user") || "null");

    const title = document.getElementById("dashboardTitle");
    const subtitle = document.getElementById("dashboardSubtitle");
    const stats = document.getElementById("dashboardStats");
    const message = document.getElementById("dashboardMessage");
    const welcomeUser = document.getElementById("welcomeUser");

    // Check login
    if (!token || !user || !user.role) {
        window.location.href = "login.html";
        return;
    }

    // Welcome message
    if (welcomeUser) {
        welcomeUser.textContent = `Welcome, ${user.name}`;
    }

    const role = user.role.toLowerCase();

    // Hide all role-specific action sections first
    const roleSections = [
        "donorActions",
        "recipientActions",
        "ngoActions",
        "adminActions"
    ];

    roleSections.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            section.style.display = "none";
        }
    });

    // Show actions according to user role
    const roleSectionMap = {
        donor: "donorActions",
        recipient: "recipientActions",
        ngo: "ngoActions",
        admin: "adminActions"
    };

    const activeSection = document.getElementById(roleSectionMap[role]);

    if (activeSection) {
        activeSection.style.display = "block";
    }

    // Dashboard configuration
    const dashboardConfig = {
        donor: {
            title: "Donor Dashboard",
            endpoint: "/dashboard/donor"
        },

        recipient: {
            title: "Recipient Dashboard",
            endpoint: "/dashboard/recipient"
        },

        ngo: {
            title: "NGO Dashboard",
            endpoint: "/dashboard/ngo"
        },

        admin: {
            title: "Admin Dashboard",
            endpoint: "/dashboard/admin"
        }
    };

    const config = dashboardConfig[role];

    if (!config) {
        if (message) {
            message.textContent = "Invalid user role.";
        }
        return;
    }

    // Set dashboard title
    if (title) {
        title.textContent = config.title;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}${config.endpoint}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to load dashboard."
            );
        }

        const dashboard = data.dashboard || {};

        // Dashboard subtitle
        if (subtitle) {
            if (role === "ngo" && dashboard.organizationName) {
                subtitle.textContent =
                    `Organization: ${dashboard.organizationName} | Verification: ${dashboard.verificationStatus}`;
            } else {
                subtitle.textContent =
                    "Here is an overview of your HelpHub activity.";
            }
        }

        // Clear previous statistics
        if (stats) {
            stats.innerHTML = "";

            // Generate statistics cards
            Object.entries(dashboard).forEach(([key, value]) => {
                if (typeof value !== "number") {
                    return;
                }

                const card = document.createElement("div");
                card.className = "stat-card";

                const heading = document.createElement("h3");

                heading.textContent = key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, char => char.toUpperCase());

                const number = document.createElement("p");
                number.textContent = value;

                card.append(heading, number);
                stats.appendChild(card);
            });

            if (!stats.children.length) {
                stats.textContent =
                    "No dashboard statistics available yet.";
            }
        }

    } catch (error) {
        if (role === "ngo" && /profile not found/i.test(error.message)) {
            if (stats) {
                stats.innerHTML = `
                    <div class="stat-card">
                        <h3>NGO profile not registered</h3>
                        <p>Register your organization profile to start coordinating community support.</p>
                        <a class="btn" href="ngo-profile.html">Create NGO Profile</a>
                    </div>`;
            }
            if (message) message.textContent = "";
            return;
        }

        if (message) {
            message.textContent = error.message;
        }
    }
});

// Logout
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        window.location.href = "login.html";
    });
}
