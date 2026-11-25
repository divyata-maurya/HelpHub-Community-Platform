
const API_BASE = window.HELPHUB_CONFIG.API_BASE_URL;

const reportsList = document.getElementById("myReportsList");

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char];
    });
}

function formatLabel(value) {
    return String(value || "")
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
}

function formatDate(value) {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

async function loadMyReports() {
    const token = sessionStorage.getItem("token");

    if (!token) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/reports/my-reports`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load reports.");
        }

        const reports = data.reports || [];

        if (reports.length === 0) {
            reportsList.innerHTML = `
                <div class="empty-reports">
                    <h3>No Reports Found</h3>
                    <p>You have not submitted any reports yet.</p>
                    <a href="submit-report.html" class="report-link">
                        Submit Your First Report
                    </a>
                </div>
            `;
            return;
        }

        reportsList.innerHTML = reports.map(report => `
            <div class="report-card">

                <div class="report-card-header">
                    <h3>${escapeHTML(formatLabel(report.targetType))} Report</h3>
                    <span class="status-badge status-${escapeHTML(
                        String(report.status || "").toLowerCase()
                    )}">
                        ${escapeHTML(formatLabel(report.status))}
                    </span>
                </div>

                <p><strong>Target ID:</strong>
                    ${escapeHTML(report.targetId)}
                </p>

                <p><strong>Reason:</strong>
                    ${escapeHTML(formatLabel(report.reason))}
                </p>

                <p><strong>Description:</strong>
                    ${escapeHTML(report.description || "No additional details")}
                </p>

                <p><strong>Submitted On:</strong>
                    ${escapeHTML(formatDate(report.createdAt))}
                </p>

            </div>
        `).join("");

    } catch (error) {
        reportsList.innerHTML = `
            <p class="error-message">${escapeHTML(error.message)}</p>
        `;
    }
}

loadMyReports();
