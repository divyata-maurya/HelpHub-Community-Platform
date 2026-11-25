
const API_BASE_URL = window.HELPHUB_CONFIG.API_BASE_URL;

const requestsMessage = document.getElementById("requestsMessage");
const requestsContainer = document.getElementById("myRequestsContainer");

async function loadMyRequests() {
    const token = sessionStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/requests/my-requests`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load requests.");
        }

        requestsContainer.innerHTML = "";

        const requests = data.requests || [];

        requestsMessage.textContent =
            `Total Requests: ${data.totalRequests}`;

        if (requests.length === 0) {
            requestsMessage.textContent =
                "You have not submitted any donation requests yet.";
            return;
        }

        requests.forEach(request => {
            const card = document.createElement("div");
            card.className = "stat-card";
            card.style.marginBottom = "20px";

            const donation = request.donationId || {};

            const title = document.createElement("h3");
            title.textContent = donation.title || "Donation";

            const quantity = document.createElement("p");
            quantity.textContent =
                `Requested Quantity: ${request.requestedQuantity} ${donation.unit || ""}`;

            const donor = document.createElement("p");
            donor.textContent =
                `Donor: ${request.donorId?.name || "Not available"}`;

            const status = document.createElement("p");
            status.textContent = `Status: ${request.status}`;

            const message = document.createElement("p");
            message.textContent =
                `Message: ${request.message || "No message added"}`;

            card.append(title, quantity, donor, status, message);

            if (["PENDING", "ACCEPTED"].includes(request.status)) {
                const cancelButton = document.createElement("button");
                cancelButton.className = "btn";
                cancelButton.textContent = "Cancel Request";

                cancelButton.addEventListener("click", () => {
                    updateRequest(request._id, "cancel");
                });

                card.appendChild(cancelButton);
            }

            if (request.status === "HANDED_OVER") {
                const confirmButton = document.createElement("button");
                confirmButton.className = "btn";
                confirmButton.textContent = "Confirm Receipt";

                confirmButton.addEventListener("click", () => {
                    updateRequest(request._id, "confirm-receipt");
                });

                card.appendChild(confirmButton);
            }

            requestsContainer.appendChild(card);
        });

    } catch (error) {
        requestsMessage.textContent = error.message;
        requestsMessage.style.color = "red";
    }
}

async function updateRequest(requestId, action) {
    const token = sessionStorage.getItem("token");

    const confirmation = confirm(
        action === "cancel"
            ? "Are you sure you want to cancel this request?"
            : "Have you received this donation?"
    );

    if (!confirmation) return;

    try {
        const response = await fetch(
            `${API_BASE_URL}/requests/${requestId}/${action}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Action failed.");
        }

        alert(data.message);
        loadMyRequests();

    } catch (error) {
        alert(error.message);
    }
}

loadMyRequests();
