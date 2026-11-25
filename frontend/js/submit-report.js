
const API_BASE = window.HELPHUB_CONFIG.API_BASE_URL;

const reportForm = document.getElementById("reportForm");
const reportMessage = document.getElementById("reportMessage");

reportForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const token = sessionStorage.getItem("token");

    if (!token) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    const targetType = document.getElementById("targetType").value;
    const targetId = document.getElementById("targetId").value.trim();
    const reason = document.getElementById("reason").value;
    const description = document.getElementById("description").value.trim();

    if (!/^[0-9a-fA-F]{24}$/.test(targetId)) {
        reportMessage.textContent = "Please enter a valid 24-character ID.";
        reportMessage.className = "error-message";
        return;
    }

    const reportData = {
        targetType,
        targetId,
        reason,
        description
    };

    try {
        const response = await fetch(`${API_BASE}/reports`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(reportData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to submit report.");
        }

        reportMessage.textContent = "Report submitted successfully!";
        reportMessage.className = "success-message";

        reportForm.reset();

    } catch (error) {
        reportMessage.textContent = error.message;
        reportMessage.className = "error-message";
    }
});
