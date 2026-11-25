
const API_BASE = window.HELPHUB_CONFIG.API_BASE_URL;

const token = sessionStorage.getItem("token");
const user = JSON.parse(sessionStorage.getItem("user") || "null");

const ngoForm = document.getElementById("ngoForm");
const profileMessage = document.getElementById("profileMessage");
const profileDetails = document.getElementById("profileDetails");
const submitBtn = document.getElementById("submitBtn");

if (!token || !user) {
    alert("Please login first.");
    window.location.href = "login.html";
}

if (user && user.role !== "ngo") {
    alert("Only NGO accounts can access this page.");
    window.location.href = "dashboard.html";
}

function showMessage(message, type = "success") {
    profileMessage.textContent = message;
    profileMessage.className = `message ${type}`;
}

function getProfile(data) {
    return data.ngoProfile || data.ngo || data.profile || data.data || null;
}

function displayProfile(profile) {
    if (!profile) {
        profileDetails.innerHTML = "<p>No NGO profile registered yet.</p>";
        return;
    }

    const areas = Array.isArray(profile.serviceAreas)
        ? profile.serviceAreas : [];

    const documents = Array.isArray(profile.documents)
        ? profile.documents : [];

    profileDetails.innerHTML = `
        <div class="detail">
            <strong>Organization:</strong>
            <span>${escapeHTML(profile.organizationName || "")}</span>
        </div>

        <div class="detail">
            <strong>Registration Number:</strong>
            <span>${escapeHTML(profile.registrationNumber || "")}</span>
        </div>

        <div class="detail">
            <strong>Description:</strong>
            <span>${escapeHTML(profile.description || "Not provided")}</span>
        </div>

        <div class="detail">
            <strong>Service Areas:</strong>
            <span>${areas.length ? areas.map(escapeHTML).join(", ") : "Not provided"}</span>
        </div>

        <div class="detail">
            <strong>Documents:</strong>
            <span>${documents.length ? documents.map(escapeHTML).join(", ") : "Not provided"}</span>
        </div>

        <div class="detail">
            <strong>Verification Status:</strong>
            <span class="status ${String(profile.verificationStatus || "PENDING").toLowerCase()}">
                ${escapeHTML(profile.verificationStatus || "PENDING")}
            </span>
        </div>
    `;

    // Profile already exists. Backend currently has no NGO profile update route.
    ngoForm.style.display = "none";
    profileDetails.insertAdjacentHTML(
        "beforeend",
        "<p class='info-text'>Your NGO profile has been registered. Contact the administrator if any details need correction.</p>"
    );
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE}/ngos/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            const profile = getProfile(data);
            displayProfile(profile);
        } else if (response.status === 404) {
            profileDetails.innerHTML = "<p>No NGO profile registered yet. Please complete the form.</p>";
        } else {
            profileDetails.textContent = data.message || "Unable to load NGO profile.";
        }
    } catch (error) {
        profileDetails.textContent = "Server connection failed. Please try again.";
    }
}

ngoForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const serviceAreas = document.getElementById("serviceAreas").value
        .split(/[\n,]+/)
        .map(item => item.trim())
        .filter(Boolean);

    const documents = document.getElementById("documents").value
        .split("\n")
        .map(item => item.trim())
        .filter(Boolean);

    const payload = {
        organizationName: document.getElementById("organizationName").value.trim(),
        registrationNumber: document.getElementById("registrationNumber").value.trim(),
        description: document.getElementById("description").value.trim(),
        serviceAreas,
        documents
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Registering...";

    try {
        const response = await fetch(`${API_BASE}/ngos/profile`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || "NGO registration failed.", "error");
            return;
        }

        showMessage(data.message || "NGO profile registered successfully!", "success");
        ngoForm.reset();

        await loadProfile();

    } catch (error) {
        showMessage("Server connection failed. Please try again.", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Register NGO Profile";
    }
});

loadProfile();
