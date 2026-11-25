const API_BASE_URL = window.HELPHUB_CONFIG.API_BASE_URL;

const token = sessionStorage.getItem("token");
const user = JSON.parse(sessionStorage.getItem("user") || "null");

const notificationsList = document.getElementById("notificationsList");
const notificationMessage = document.getElementById("notificationMessage");
const totalNotifications = document.getElementById("totalNotifications");
const unreadNotifications = document.getElementById("unreadNotifications");
const markAllReadBtn = document.getElementById("markAllReadBtn");
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
    notificationMessage.textContent = message;
    notificationMessage.className = isError
        ? "notification-message error"
        : "notification-message";
}

function formatDate(date) {
    if (!date) return "Date not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Date not available";
    }

    return parsedDate.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function updateSummary(notifications) {
    const unreadCount = notifications.filter(item => !item.isRead).length;

    totalNotifications.textContent = `Total: ${notifications.length}`;
    unreadNotifications.textContent = `Unread: ${unreadCount}`;

    markAllReadBtn.disabled = unreadCount === 0;
}

function renderNotification(notification) {
    const card = document.createElement("article");

    card.className = `notification-card ${notification.isRead ? "read" : "unread"}`;

    const type = String(notification.type || "SYSTEM").replace(/_/g, " ");
    const createdAt = formatDate(notification.createdAt);

    card.innerHTML = `
        <div class="notification-card-content">

            <div class="notification-card-heading">
                <h3>${escapeHTML(notification.title)}</h3>

                <span class="notification-type">
                    ${escapeHTML(type)}
                </span>
            </div>

            <p class="notification-description">
                ${escapeHTML(notification.message)}
            </p>

            <p class="notification-date">
                ${escapeHTML(createdAt)}
            </p>

            <div class="notification-actions">

                ${
                    notification.isRead
                        ? `<span class="read-label">Read</span>`
                        : `<button
                                type="button"
                                class="read-btn"
                                data-action="read"
                                data-id="${escapeHTML(notification._id)}">
                                Mark as Read
                           </button>`
                }

                <button
                    type="button"
                    class="delete-btn"
                    data-action="delete"
                    data-id="${escapeHTML(notification._id)}">
                    Delete
                </button>

            </div>

        </div>
    `;

    return card;
}

async function loadNotifications() {
    notificationsList.innerHTML = "";
    showMessage("Loading notifications...");

    try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load notifications.");
        }

        const notifications = data.notifications || [];

        updateSummary(notifications);

        if (notifications.length === 0) {
            showMessage("You don't have any notifications yet.");
            return;
        }

        showMessage(`${notifications.length} notification(s) found.`);

        notifications.forEach(notification => {
            notificationsList.appendChild(renderNotification(notification));
        });

    } catch (error) {
        showMessage(error.message, true);
    }
}

notificationsList.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const notificationId = button.dataset.id;
    const action = button.dataset.action;

    let endpoint = "";
    let method = "PATCH";

    if (action === "read") {
        endpoint = `${API_BASE_URL}/notifications/${notificationId}/read`;
    } else if (action === "delete") {
        endpoint = `${API_BASE_URL}/notifications/${notificationId}`;
        method = "DELETE";

        if (!confirm("Are you sure you want to delete this notification?")) {
            return;
        }
    } else {
        return;
    }

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Please wait...";

    try {
        const response = await fetch(endpoint, {
            method,
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Action could not be completed.");
        }

        await loadNotifications();

    } catch (error) {
        alert(error.message);
        button.disabled = false;
        button.textContent = originalText;
    }
});

markAllReadBtn.addEventListener("click", async () => {
    if (markAllReadBtn.disabled) return;

    markAllReadBtn.disabled = true;
    markAllReadBtn.textContent = "Please wait...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/notifications/mark-all-read`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to update notifications.");
        }

        await loadNotifications();

    } catch (error) {
        alert(error.message);
    } finally {
        markAllReadBtn.textContent = "Mark All as Read";
    }
});

logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "login.html";
});

if (!token || !user) {
    window.location.href = "login.html";
} else {
    loadNotifications();
}