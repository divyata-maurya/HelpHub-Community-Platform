
const API_BASE_URL = window.HELPHUB_CONFIG.API_BASE_URL;

const token = sessionStorage.getItem("token");
const user = JSON.parse(sessionStorage.getItem("user") || "null");

const container = document.getElementById("receivedRequestsContainer");
const messageBox = document.getElementById("requestMessage");
const logoutBtn = document.getElementById("logoutBtn");

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function showMessage(message, isError = false) {
    messageBox.textContent = message;
    messageBox.className = isError
        ? "request-message error"
        : "request-message";
}

function formatDate(date) {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Not available";
    }

    return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function statusClass(status) {
    return String(status || "").toLowerCase().replace(/_/g, "-");
}

function renderRequest(request) {
    const donation = request.donationId || {};
    const requester = request.requesterId || {};
    const status = request.status || "UNKNOWN";

    const card = document.createElement("article");
    card.className = "received-request-card";

    let actionButtons = "";

    if (status === "PENDING") {
        actionButtons = `
            <div class="request-actions">
                <button class="accept-btn" data-action="accept"
                    data-id="${escapeHTML(request._id)}">
                    Accept Request
                </button>
                <button class="reject-btn" data-action="reject"
                    data-id="${escapeHTML(request._id)}">
                    Reject Request
                </button>
            </div>
        `;
    } else if (status === "ACCEPTED") {
        actionButtons = `
            <div class="request-actions">
                <button class="handover-btn" data-action="handover"
                    data-id="${escapeHTML(request._id)}">
                    Mark as Handed Over
                </button>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="request-card-top">
            <h3>${escapeHTML(donation.title || "Donation")}</h3>
            <span class="request-status ${statusClass(status)}">
                ${escapeHTML(status.replace(/_/g, " "))}
            </span>
        </div>

        <div class="request-details">
            <p><strong>Category:</strong>
                ${escapeHTML(donation.category || "Not specified")}
            </p>
            <p><strong>Requester:</strong>
                ${escapeHTML(requester.name || "Unknown user")}
            </p>
            <p><strong>Email:</strong>
                ${escapeHTML(requester.email || "Not available")}
            </p>
            <p><strong>Phone:</strong>
                ${escapeHTML(requester.phone || "Not available")}
            </p>
            <p><strong>Requested Quantity:</strong>
                ${escapeHTML(request.requestedQuantity)} 
                ${escapeHTML(donation.unit || "items")}
            </p>
            <p><strong>Donation Available Quantity:</strong>
                ${escapeHTML(donation.availableQuantity ?? "Not available")}
            </p>
            <p><strong>Request Date:</strong>
                ${formatDate(request.createdAt)}
            </p>
            <p><strong>Message:</strong>
                ${escapeHTML(request.message || "No message provided")}
            </p>
        </div>

        ${actionButtons}
    `;

    return card;
}

async function loadReceivedRequests() {
    container.innerHTML = "";
    showMessage("Loading received requests...");

    try {
        const response = await fetch(
            `${API_BASE_URL}/requests/received`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load requests.");
        }

        const requests = data.requests || [];

        if (requests.length === 0) {
            showMessage("No donation requests received yet.");
            return;
        }

        showMessage(`${data.totalRequests ?? requests.length} request(s) found.`);

        requests.forEach(request => {
            container.appendChild(renderRequest(request));
        });

    } catch (error) {
        showMessage(error.message, true);
    }
}

container.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const requestId = button.dataset.id;
    const action = button.dataset.action;

    let endpoint = "";
    let requestBody = {};
    let confirmation = "";

    if (action === "accept") {
        endpoint = `${API_BASE_URL}/requests/${requestId}/review`;
        requestBody = { status: "ACCEPTED" };
        confirmation = "Are you sure you want to accept this request?";
    } else if (action === "reject") {
        endpoint = `${API_BASE_URL}/requests/${requestId}/review`;
        requestBody = { status: "REJECTED" };
        confirmation = "Are you sure you want to reject this request?";
    } else if (action === "handover") {
        endpoint = `${API_BASE_URL}/requests/${requestId}/handed-over`;
        confirmation = "Confirm that you have handed over this donation?";
    }

    if (!confirm(confirmation)) return;

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Please wait...";

    try {
        const options = {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        };

        if (action !== "handover") {
            options.body = JSON.stringify(requestBody);
        }

        const response = await fetch(endpoint, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Action could not be completed.");
        }

        alert(data.message || "Request updated successfully.");
        await loadReceivedRequests();

    } catch (error) {
        alert(error.message);
        button.disabled = false;
        button.textContent = originalText;
    }
});

logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "login.html";
});

if (!token || !user || user.role?.toLowerCase() !== "donor") {
    window.location.href = "login.html";
} else {
    loadReceivedRequests();
}
