
const API_BASE_URL = window.HELPHUB_CONFIG.API_BASE_URL;

const token = sessionStorage.getItem("token");

let allNgos = [];

const ngoList = document.getElementById("ngoList");
const ngoMessage = document.getElementById("ngoMessage");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

function getStoredUser() {
    try {
        return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
        return null;
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function showMessage(message, isError = false) {
    ngoMessage.textContent = message;
    ngoMessage.className = isError ? "error-message" : "success-message";
}

async function apiRequest(url, options = {}) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}

async function loadNgos() {
    ngoList.innerHTML = "<p>Loading NGO profiles...</p>";
    showMessage("");

    try {
        const data = await apiRequest("/ngos");

        allNgos = data.ngos || [];

        updateStats();
        renderNgos();

    } catch (error) {
        ngoList.innerHTML = "<p>Unable to load NGO profiles.</p>";
        showMessage(error.message, true);
    }
}

function updateStats() {
    document.getElementById("totalNgos").textContent = allNgos.length;

    document.getElementById("pendingNgos").textContent =
        allNgos.filter(ngo => ngo.verificationStatus === "PENDING").length;

    document.getElementById("verifiedNgos").textContent =
        allNgos.filter(ngo => ngo.verificationStatus === "VERIFIED").length;

    document.getElementById("rejectedNgos").textContent =
        allNgos.filter(ngo => ngo.verificationStatus === "REJECTED").length;
}

function renderNgos() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    const filteredNgos = allNgos.filter(ngo => {
        const organizationName = (ngo.organizationName || "").toLowerCase();
        const registrationNumber = (ngo.registrationNumber || "").toLowerCase();
        const ownerName = (ngo.userId?.name || "").toLowerCase();

        const matchesSearch =
            organizationName.includes(searchTerm) ||
            registrationNumber.includes(searchTerm) ||
            ownerName.includes(searchTerm);

        const matchesStatus =
            !selectedStatus ||
            ngo.verificationStatus === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    if (!filteredNgos.length) {
        ngoList.innerHTML = "<p class='empty-message'>No NGO profiles found.</p>";
        return;
    }

    ngoList.innerHTML = filteredNgos.map(ngo => {
        const status = ngo.verificationStatus || "PENDING";

        const owner = ngo.userId || {};
        const verifiedBy = ngo.verifiedBy || {};

        const serviceAreas = Array.isArray(ngo.serviceAreas)
            ? ngo.serviceAreas.join(", ")
            : "";

        const createdDate = ngo.createdAt
            ? new Date(ngo.createdAt).toLocaleDateString()
            : "N/A";

        return `
            <article class="ngo-card">

                <div class="ngo-card-header">
                    <h2>${escapeHTML(ngo.organizationName)}</h2>

                    <span class="status-badge ${status.toLowerCase()}">
                        ${escapeHTML(status)}
                    </span>
                </div>

                <div class="ngo-details">
                    <p>
                        <strong>Registration Number:</strong>
                        ${escapeHTML(ngo.registrationNumber)}
                    </p>

                    <p>
                        <strong>Owner:</strong>
                        ${escapeHTML(owner.name || "N/A")}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        ${escapeHTML(owner.email || "N/A")}
                    </p>

                    <p>
                        <strong>Account Status:</strong>
                        ${owner.isActive === undefined
                            ? "N/A"
                            : owner.isActive ? "Active" : "Inactive"}
                    </p>

                    <p>
                        <strong>Description:</strong>
                        ${escapeHTML(ngo.description || "No description provided.")}
                    </p>

                    <p>
                        <strong>Service Areas:</strong>
                        ${escapeHTML(serviceAreas || "Not specified")}
                    </p>

                    <p>
                        <strong>Submitted On:</strong>
                        ${createdDate}
                    </p>

                    ${status !== "PENDING" ? `
                        <p>
                            <strong>Reviewed By:</strong>
                            ${escapeHTML(verifiedBy.name || "N/A")}
                        </p>
                    ` : ""}
                </div>

                ${status === "PENDING" ? `
                    <div class="ngo-actions">
                        <button
                            class="verify-btn"
                            data-id="${escapeHTML(ngo._id)}"
                            data-status="VERIFIED">
                            Verify NGO
                        </button>

                        <button
                            class="reject-btn"
                            data-id="${escapeHTML(ngo._id)}"
                            data-status="REJECTED">
                            Reject NGO
                        </button>
                    </div>
                ` : `
                    <p class="reviewed-message">
                        This NGO has already been reviewed.
                    </p>
                `}

            </article>
        `;
    }).join("");
}

async function updateVerification(ngoId, verificationStatus) {
    const action = verificationStatus === "VERIFIED"
        ? "verify"
        : "reject";

    const confirmed = confirm(
        `Are you sure you want to ${action} this NGO?`
    );

    if (!confirmed) return;

    try {
        const data = await apiRequest(
            `/ngos/${encodeURIComponent(ngoId)}/verification`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    verificationStatus
                })
            }
        );

        showMessage(data.message || "NGO verification updated successfully.");

        await loadNgos();

    } catch (error) {
        showMessage(error.message, true);
    }
}

ngoList.addEventListener("click", event => {
    const button = event.target.closest("button[data-status]");

    if (!button) return;

    updateVerification(
        button.dataset.id,
        button.dataset.status
    );
});

document.getElementById("filterBtn").addEventListener("click", renderNgos);

document.getElementById("resetBtn").addEventListener("click", () => {
    searchInput.value = "";
    statusFilter.value = "";
    renderNgos();
});

searchInput.addEventListener("input", renderNgos);

document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "login.html";
});

// Admin access check
const loggedInUser = getStoredUser();

if (!token || !loggedInUser || loggedInUser.role !== "admin") {
    alert("Admin access required.");
    window.location.href = "login.html";
} else {
    loadNgos();
}
