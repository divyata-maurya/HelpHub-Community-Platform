
const API_BASE_URL = window.HELPHUB_CONFIG.API_BASE_URL;
const BACKEND_URL = window.HELPHUB_CONFIG.BACKEND_URL;

let currentPage = 1;
let totalPages = 1;

const token = sessionStorage.getItem("token");
const user = JSON.parse(sessionStorage.getItem("user") || "null");

const container = document.getElementById("pendingDonationsContainer");
const message = document.getElementById("adminMessage");
const prevButton = document.getElementById("prevPage");
const nextButton = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");

// HTML escaping for safe display
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Check Admin Authentication
if (!token || !user || user.role?.toLowerCase() !== "admin") {
    window.location.href = "login.html";
}

// Display messages
function showMessage(text, isError = false) {
    message.textContent = text;
    message.className = isError
        ? "admin-message error"
        : "admin-message success";
}

// Format date
function formatDate(date) {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Image URL helper
function getImageURL(imagePath) {
    if (!imagePath) return "";

    if (/^https?:\/\//i.test(imagePath)) {
        return imagePath;
    }

    return `${BACKEND_URL}/${imagePath.replace(/^\/+/, "")}`;
}

// Load pending donations
async function loadPendingDonations() {
    container.innerHTML = "";
    showMessage("Loading pending donations...");

    try {
        const response = await fetch(
            `${API_BASE_URL}/admin/donations/pending?page=${currentPage}&limit=10`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load donations.");
        }

        const donations = data.donations || [];

        totalPages = data.totalPages || 1;

        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

        prevButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= totalPages;

        if (donations.length === 0) {
            showMessage("There are no pending donations right now.");
            return;
        }

        showMessage(`${data.totalDonations} pending donation(s) found.`);

        donations.forEach(donation => {
            const donor = donation.donorId || {};
            const location = donation.location || {};

            const image = donation.images?.[0]
                ? `<img class="donation-image"
                    src="${escapeHTML(getImageURL(donation.images[0]))}"
                    alt="${escapeHTML(donation.title)}"
                    onerror="this.style.display='none'">`
                : `<div class="no-image">No Image Available</div>`;

            const card = document.createElement("article");
            card.className = "pending-donation-card";

            card.innerHTML = `
                ${image}

                <div class="donation-content">

                    <span class="pending-badge">Pending Review</span>

                    <h2>${escapeHTML(donation.title)}</h2>

                    <p class="donation-description">
                        ${escapeHTML(donation.description)}
                    </p>

                    <div class="donation-details">
                        <p><strong>Category:</strong> ${escapeHTML(donation.category)}</p>
                        <p><strong>Quantity:</strong> ${escapeHTML(donation.quantity)} ${escapeHTML(donation.unit)}</p>
                        <p><strong>Condition:</strong> ${escapeHTML(donation.condition)}</p>
                        <p><strong>Donor:</strong> ${escapeHTML(donor.name || "Unknown")}</p>
                        <p><strong>Donor Email:</strong> ${escapeHTML(donor.email || "Not available")}</p>
                        <p><strong>Location:</strong> ${escapeHTML([
                            location.address,
                            location.city,
                            location.state,
                            location.country,
                            location.postalCode
                        ].filter(Boolean).join(", ") || "Not available")}</p>
                        <p><strong>Submitted:</strong> ${formatDate(donation.createdAt)}</p>
                    </div>

                    <div class="admin-action-buttons">
                        <button
                            class="btn approve-btn"
                            data-id="${escapeHTML(donation._id)}"
                            data-action="approve">
                            Approve
                        </button>

                        <button
                            class="btn reject-btn"
                            data-id="${escapeHTML(donation._id)}"
                            data-action="reject">
                            Reject
                        </button>
                    </div>

                </div>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        showMessage(error.message, true);
    }
}

// Approve or Reject Donation
container.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const donationId = button.dataset.id;
    const action = button.dataset.action;

    const confirmed = window.confirm(
        `Are you sure you want to ${action} this donation?`
    );

    if (!confirmed) return;

    const originalText = button.textContent;

    button.disabled = true;
    button.textContent = "Please wait...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/admin/donations/${donationId}/${action}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Unable to ${action} donation.`);
        }

        alert(data.message || `Donation ${action}d successfully.`);

        await loadPendingDonations();

    } catch (error) {
        alert(error.message);
        button.disabled = false;
        button.textContent = originalText;
    }
});

// Pagination
prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        loadPendingDonations();
    }
});

nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
        currentPage++;
        loadPendingDonations();
    }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "login.html";
});

// Initial load
if (token && user?.role?.toLowerCase() === "admin") {
    loadPendingDonations();
}
