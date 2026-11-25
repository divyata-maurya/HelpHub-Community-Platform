
const API_BASE_URL = window.HELPHUB_CONFIG.API_BASE_URL;

const token = sessionStorage.getItem("token");

let currentPage = 1;
const limit = 10;
let totalPages = 1;
let currentUsers = [];

const usersTableBody = document.getElementById("usersTableBody");
const usersMessage = document.getElementById("usersMessage");

const roleFilter = document.getElementById("roleFilter");
const statusFilter = document.getElementById("statusFilter");
const searchInput = document.getElementById("searchInput");

const totalUsersElement = document.getElementById("totalUsers");
const activeUsersElement = document.getElementById("activeUsers");
const inactiveUsersElement = document.getElementById("inactiveUsers");

function getStoredUser() {
    try {
        return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
        return null;
    }
}

function showMessage(message, isError = false) {
    usersMessage.textContent = message;
    usersMessage.className = isError ? "error-message" : "success-message";
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
        if (response.status === 401 || response.status === 403) {
            throw new Error(data.message || "Access denied. Please log in again.");
        }

        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}

async function loadUsers() {
    usersTableBody.innerHTML =
        '<tr><td colspan="7">Loading users...</td></tr>';

    showMessage("");

    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit
        });

        if (roleFilter.value) {
            params.set("role", roleFilter.value);
        }

        if (statusFilter.value) {
            params.set("isActive", statusFilter.value);
        }

        const data = await apiRequest(`/users?${params.toString()}`);

        currentUsers = data.users || [];
        totalPages = data.totalPages || 1;

        totalUsersElement.textContent = data.totalUsers ?? 0;

        // These counts are based on the currently loaded page.
        activeUsersElement.textContent =
            currentUsers.filter(user => user.isActive).length;

        inactiveUsersElement.textContent =
            currentUsers.filter(user => !user.isActive).length;

        renderUsers();
        updatePagination();

    } catch (error) {
        usersTableBody.innerHTML =
            '<tr><td colspan="7">Unable to load users.</td></tr>';

        showMessage(error.message, true);
    }
}

function renderUsers() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredUsers = currentUsers.filter(user =>
        (user.name || "").toLowerCase().includes(searchTerm) ||
        (user.email || "").toLowerCase().includes(searchTerm)
    );

    if (!filteredUsers.length) {
        usersTableBody.innerHTML =
            '<tr><td colspan="7">No users found.</td></tr>';
        return;
    }

    usersTableBody.innerHTML = filteredUsers.map(user => {
        const joinedDate = user.createdAt
            ? new Date(user.createdAt).toLocaleDateString()
            : "N/A";

        const isActive = user.isActive;
        const currentUser = getStoredUser();

        const isOwnAccount =
            currentUser &&
            String(currentUser._id || currentUser.id) === String(user._id);

        return `
            <tr>
                <td>${escapeHTML(user.name)}</td>
                <td>${escapeHTML(user.email)}</td>
                <td><span class="role-badge">${escapeHTML(user.role)}</span></td>
                <td>${escapeHTML(user.phone || "N/A")}</td>
                <td>
                    <span class="status ${isActive ? "active" : "inactive"}">
                        ${isActive ? "Active" : "Inactive"}
                    </span>
                </td>
                <td>${joinedDate}</td>
                <td class="action-buttons">
                    <button class="view-btn"
                        data-action="view"
                        data-id="${escapeHTML(user._id)}">
                        View
                    </button>

                    <button class="${isActive ? "deactivate-btn" : "activate-btn"}"
                        data-action="toggle"
                        data-id="${escapeHTML(user._id)}"
                        data-status="${!isActive}"
                        ${isOwnAccount ? "disabled title='You cannot deactivate your own account'" : ""}>
                        ${isActive ? "Deactivate" : "Activate"}
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

function updatePagination() {
    document.getElementById("pageInfo").textContent =
        `Page ${currentPage} of ${totalPages}`;

    document.getElementById("prevBtn").disabled = currentPage <= 1;
    document.getElementById("nextBtn").disabled = currentPage >= totalPages;
}

async function viewUser(userId) {
    try {
        const data = await apiRequest(`/users/${encodeURIComponent(userId)}`);
        const user = data.user;

        document.getElementById("userDetails").innerHTML = `
            <p><strong>Name:</strong> ${escapeHTML(user.name)}</p>
            <p><strong>Email:</strong> ${escapeHTML(user.email)}</p>
            <p><strong>Role:</strong> ${escapeHTML(user.role)}</p>
            <p><strong>Phone:</strong> ${escapeHTML(user.phone || "N/A")}</p>
            <p><strong>Address:</strong> ${escapeHTML(user.address || "N/A")}</p>
            <p><strong>Email Verified:</strong> ${user.isEmailVerified ? "Yes" : "No"}</p>
            <p><strong>Account Status:</strong> ${user.isActive ? "Active" : "Inactive"}</p>
            <p><strong>Joined:</strong> ${user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"}</p>
        `;

        document.getElementById("userModal").style.display = "flex";

    } catch (error) {
        showMessage(error.message, true);
    }
}

async function toggleUserStatus(userId, newStatus) {
    const action = newStatus ? "activate" : "deactivate";

    if (!confirm(`Are you sure you want to ${action} this account?`)) {
        return;
    }

    try {
        const data = await apiRequest(
            `/users/${encodeURIComponent(userId)}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    isActive: newStatus
                })
            }
        );

        showMessage(data.message || "User status updated successfully.");
        await loadUsers();

    } catch (error) {
        showMessage(error.message, true);
    }
}

usersTableBody.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const userId = button.dataset.id;

    if (button.dataset.action === "view") {
        viewUser(userId);
    }

    if (button.dataset.action === "toggle") {
        toggleUserStatus(userId, button.dataset.status === "true");
    }
});

document.getElementById("filterBtn").addEventListener("click", () => {
    currentPage = 1;
    loadUsers();
});

document.getElementById("resetBtn").addEventListener("click", () => {
    roleFilter.value = "";
    statusFilter.value = "";
    searchInput.value = "";
    currentPage = 1;
    loadUsers();
});

searchInput.addEventListener("input", renderUsers);

document.getElementById("prevBtn").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        loadUsers();
    }
});

document.getElementById("nextBtn").addEventListener("click", () => {
    if (currentPage < totalPages) {
        currentPage++;
        loadUsers();
    }
});

document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("userModal").style.display = "none";
});

document.getElementById("userModal").addEventListener("click", event => {
    if (event.target.id === "userModal") {
        event.currentTarget.style.display = "none";
    }
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
    loadUsers();
}
