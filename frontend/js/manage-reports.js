
const API_BASE_URL = window.HELPHUB_CONFIG.API_BASE_URL;

const token = sessionStorage.getItem("token");

const reportsList = document.getElementById("reportsList");
const reportsMessage = document.getElementById("reportsMessage");
const statusFilter = document.getElementById("statusFilter");

let allReports = [];

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
    reportsMessage.textContent = message;
    reportsMessage.className = isError
        ? "error-message"
        : "success-message";
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

async function loadReports() {
    reportsList.innerHTML = "<p>Loading reports...</p>";
    showMessage("");

    try {
        const selectedStatus = statusFilter.value;
        const query = selectedStatus
            ? `?status=${encodeURIComponent(selectedStatus)}`
            : "";

        const data = await apiRequest(`/reports${query}`);

        allReports = data.reports || [];

        updateStats();
        renderReports();

    } catch (error) {
        reportsList.innerHTML = "<p>Unable to load reports.</p>";
        showMessage(error.message, true);
    }
}

function updateStats() {
    // Counts are based on the reports currently fetched from the API.
    document.getElementById("totalReports").textContent =
        allReports.length;

    document.getElementById("pendingReports").textContent =
        allReports.filter(report => report.status === "PENDING").length;

    document.getElementById("reviewReports").textContent =
        allReports.filter(report => report.status === "UNDER_REVIEW").length;

    document.getElementById("closedReports").textContent =
        allReports.filter(report =>
            ["RESOLVED", "DISMISSED"].includes(report.status)
        ).length;
}

function renderReports() {
    if (!allReports.length) {
        reportsList.innerHTML =
            "<p class='empty-message'>No reports found.</p>";
        return;
    }

    reportsList.innerHTML = allReports.map(report => {
        const reporter = report.reporterId || {};
        const reviewer = report.reviewedBy || {};

        const status = report.status || "PENDING";
        const targetId = report.targetId?._id || report.targetId || "N/A";

        const createdDate = report.createdAt
            ? new Date(report.createdAt).toLocaleString()
            : "N/A";

        return `
            <article class="report-card">

                <div class="report-card-header">
                    <h2>${escapeHTML(report.reason || "User Report")}</h2>

                    <span class="status-badge ${status.toLowerCase().replace("_", "-")}">
                        ${escapeHTML(status.replace("_", " "))}
                    </span>
                </div>

                <div class="report-details">

                    <p>
                        <strong>Reported By:</strong>
                        ${escapeHTML(reporter.name || "Unknown User")}
                    </p>

                    <p>
                        <strong>Reporter Email:</strong>
                        ${escapeHTML(reporter.email || "N/A")}
                    </p>

                    <p>
                        <strong>Target Type:</strong>
                        ${escapeHTML(report.targetType || "N/A")}
                    </p>

                    <p>
                        <strong>Target ID:</strong>
                        ${escapeHTML(targetId)}
                    </p>

                    <p>
                        <strong>Reason:</strong>
                        ${escapeHTML(report.reason || "N/A")}
                    </p>

                    <p>
                        <strong>Description:</strong>
                        ${escapeHTML(report.description || "No additional description.")}
                    </p>

                    <p>
                        <strong>Submitted:</strong>
                        ${createdDate}
                    </p>

                    ${reviewer.name ? `
                        <p>
                            <strong>Reviewed By:</strong>
                            ${escapeHTML(reviewer.name)}
                        </p>
                    ` : ""}

                </div>

                ${["PENDING", "UNDER_REVIEW"].includes(status) ? `
                    <div class="report-actions">
                        ${status === "PENDING" ? `
                            <button
                                class="review-btn"
                                data-id="${escapeHTML(report._id)}"
                                data-status="UNDER_REVIEW">
                                Mark Under Review
                            </button>
                        ` : ""}

                        <button
                            class="resolve-btn"
                            data-id="${escapeHTML(report._id)}"
                            data-status="RESOLVED">
                            Resolve
                        </button>

                        <button
                            class="dismiss-btn"
                            data-id="${escapeHTML(report._id)}"
                            data-status="DISMISSED">
                            Dismiss
                        </button>
                    </div>
                ` : `
                    <p class="closed-message">
                        This report has been closed.
                    </p>
                `}

            </article>
        `;
    }).join("");
}

async function reviewReport(reportId, status) {
    const actionMessages = {
        UNDER_REVIEW: "mark this report as under review",
        RESOLVED: "mark this report as resolved",
        DISMISSED: "dismiss this report"
    };

    if (!confirm(`Are you sure you want to ${actionMessages[status]}?`)) {
        return;
    }

    try {
        const data = await apiRequest(
            `/reports/${encodeURIComponent(reportId)}/review`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status })
            }
        );

        showMessage(data.message || "Report updated successfully.");
        await loadReports();

    } catch (error) {
        showMessage(error.message, true);
    }
}

reportsList.addEventListener("click", event => {
    const button = event.target.closest("button[data-status]");

    if (!button) return;

    reviewReport(button.dataset.id, button.dataset.status);
});

document.getElementById("filterBtn").addEventListener("click", loadReports);

document.getElementById("resetBtn").addEventListener("click", () => {
    statusFilter.value = "";
    loadReports();
});

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
    loadReports();
}
