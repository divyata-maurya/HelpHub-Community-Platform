
const API_BASE = window.HELPHUB_CONFIG.API_BASE_URL;

const token = sessionStorage.getItem("token");
let savedUser = JSON.parse(sessionStorage.getItem("user") || "null");

const profileForm = document.getElementById("profileForm");
const passwordForm = document.getElementById("passwordForm");

const profileMessage = document.getElementById("profileMessage");
const passwordMessage = document.getElementById("passwordMessage");

// Check login
if (!token || !savedUser) {
    alert("Please login first.");
    window.location.href = "login.html";
}

// Load the latest profile from the backend (session storage may be stale).
async function loadCurrentProfile() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load your profile.");
        }

        savedUser = data.user;
        sessionStorage.setItem("user", JSON.stringify(savedUser));

        document.getElementById("name").value = savedUser.name || "";
        document.getElementById("email").value = savedUser.email || "";
        document.getElementById("phone").value = savedUser.phone || "";
        document.getElementById("address").value = savedUser.address || "";
    } catch (error) {
        profileMessage.textContent = error.message;
        profileMessage.className = "error-message";

        if (/token|unauthorized|not authorized|login/i.test(error.message)) {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            window.location.href = "login.html";
        }
    }
}

if (token && savedUser) {
    loadCurrentProfile();
}

// Update Profile
profileForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const profileData = {
        name: document.getElementById("name").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim()
    };

    try {
        const response = await fetch(`${API_BASE}/users/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Profile update failed.");
        }

        // Update session user information
        const updatedUser = {
            ...savedUser,
            ...data.user
        };

        sessionStorage.setItem("user", JSON.stringify(updatedUser));

        profileMessage.textContent =
            data.message || "Profile updated successfully.";

        profileMessage.className = "success-message";

    } catch (error) {
        profileMessage.textContent = error.message;
        profileMessage.className = "error-message";
    }
});

// Change Password
passwordForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const currentPassword =
        document.getElementById("currentPassword").value;

    const newPassword =
        document.getElementById("newPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (newPassword.length < 8) {
        passwordMessage.textContent =
            "New password must be at least 8 characters.";

        passwordMessage.className = "error-message";
        return;
    }

    if (newPassword !== confirmPassword) {
        passwordMessage.textContent =
            "New password and confirm password do not match.";

        passwordMessage.className = "error-message";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/users/change-password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Password change failed.");
        }

        alert("Password changed successfully. Please login again.");

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        window.location.href = "login.html";

    } catch (error) {
        passwordMessage.textContent = error.message;
        passwordMessage.className = "error-message";
    }
});
