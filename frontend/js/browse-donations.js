
const API_BASE_URL = window.HELPHUB_CONFIG.API_BASE_URL;

const donationsMessage = document.getElementById("donationsMessage");
const donationsContainer = document.getElementById("browseDonationsContainer");
const pagination = document.getElementById("donationsPagination");
const previousPageButton = document.getElementById("previousDonationsPage");
const nextPageButton = document.getElementById("nextDonationsPage");
const pageInfo = document.getElementById("donationsPageInfo");

let currentPage = 1;
let totalPages = 1;
const pageSize = 10;

if (previousPageButton) {
    previousPageButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage -= 1;
            loadAvailableDonations();
        }
    });
}

if (nextPageButton) {
    nextPageButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage += 1;
            loadAvailableDonations();
        }
    });
}

async function loadAvailableDonations() {
    const token = sessionStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/donations?page=${currentPage}&limit=${pageSize}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load donations.");
        }

        donationsContainer.innerHTML = "";
        totalPages = Math.max(Number(data.totalPages) || 1, 1);

        const donations = (data.donations || []).filter(
            donation =>
                donation.status === "AVAILABLE" &&
                donation.availableQuantity > 0
        );

        if (donations.length === 0) {
            donationsMessage.textContent =
                currentPage > 1
                    ? "No more donations are available on this page."
                    : "No donations are currently available.";
            if (pagination) pagination.style.display = "none";
            return;
        }

        donationsMessage.textContent =
            `${data.totalDonations ?? donations.length} donation(s) available`;

        if (pagination) {
            pagination.style.display = totalPages > 1 ? "flex" : "none";
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
            previousPageButton.disabled = currentPage <= 1;
            nextPageButton.disabled = currentPage >= totalPages;
        }

        donations.forEach(donation => {
            const card = document.createElement("div");
            card.className = "stat-card";
            card.style.marginBottom = "20px";

            const title = document.createElement("h3");
            title.textContent = donation.title;

            const description = document.createElement("p");
            description.textContent = donation.description;

            const category = document.createElement("p");
            category.textContent = `Category: ${donation.category}`;

            const quantity = document.createElement("p");
            quantity.textContent =
                `Available: ${donation.availableQuantity} ${donation.unit}`;

            const condition = document.createElement("p");
            condition.textContent = `Condition: ${donation.condition}`;

            const location = document.createElement("p");
            location.textContent =
                `Location: ${donation.location?.city || "Not specified"}, ${donation.location?.state || ""}`;

            const quantityLabel = document.createElement("label");
            quantityLabel.textContent = "Request Quantity";

            const quantityInput = document.createElement("input");
            quantityInput.type = "number";
            quantityInput.min = "1";
            quantityInput.max = donation.availableQuantity;
            quantityInput.value = "1";
            quantityInput.required = true;

            const messageLabel = document.createElement("label");
            messageLabel.textContent = "Message to Donor (Optional)";

            const messageInput = document.createElement("textarea");
            messageInput.placeholder = "Write a short message to the donor...";
            messageInput.rows = 3;

            const requestButton = document.createElement("button");
            requestButton.type = "button";
            requestButton.className = "btn";
            requestButton.textContent = "Request Donation";

            requestButton.addEventListener("click", () => {
                submitDonationRequest(
                    donation._id,
                    quantityInput.value,
                    messageInput.value,
                    donation.availableQuantity,
                    requestButton
                );
            });

            card.append(
                title,
                description,
                category,
                quantity,
                condition,
                location,
                quantityLabel,
                quantityInput,
                messageLabel,
                messageInput,
                requestButton
            );

            donationsContainer.appendChild(card);
        });

    } catch (error) {
        donationsMessage.textContent = error.message;
        donationsMessage.style.color = "red";
        if (pagination) pagination.style.display = "none";
    }
}

async function submitDonationRequest(
    donationId,
    requestedQuantity,
    message,
    availableQuantity,
    button
) {
    const token = sessionStorage.getItem("token");
    const quantity = Number(requestedQuantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
        alert("Please enter a valid quantity.");
        return;
    }

    if (quantity > availableQuantity) {
        alert(`Only ${availableQuantity} items are available.`);
        return;
    }

    if (!confirm("Are you sure you want to request this donation?")) {
        return;
    }

    try {
        button.disabled = true;
        button.textContent = "Submitting...";

        const response = await fetch(`${API_BASE_URL}/requests`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                donationId,
                requestedQuantity: quantity,
                message: message.trim()
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Request submission failed.");
        }

        alert(data.message || "Donation request submitted successfully!");

        loadAvailableDonations();

    } catch (error) {
        alert(error.message);
        button.disabled = false;
        button.textContent = "Request Donation";
    }
}

loadAvailableDonations();
