
const API_BASE_URL = window.HELPHUB_CONFIG.API_BASE_URL;

const donationsContainer = document.getElementById("donationsContainer");
const donationsMessage = document.getElementById("donationsMessage");

async function loadMyDonations() {
    const token = sessionStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/donations/my-donations`,
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

        donationsMessage.textContent =
            `Total Donations: ${data.totalDonations}`;

        donationsContainer.innerHTML = "";

        if (!data.donations || data.donations.length === 0) {
            donationsContainer.innerHTML =
                "<p>You have not submitted any donations yet.</p>";
            return;
        }

        data.donations.forEach((donation) => {
            const card = document.createElement("div");

            card.className = "stat-card";
            card.style.marginBottom = "20px";

            const title = document.createElement("h3");
            title.textContent = donation.title;

            const category = document.createElement("p");
            category.textContent = `Category: ${donation.category}`;

            const quantity = document.createElement("p");
            quantity.textContent =
                `Quantity: ${donation.quantity} ${donation.unit}`;

            const condition = document.createElement("p");
            condition.textContent = `Condition: ${donation.condition}`;

            const status = document.createElement("p");
            status.textContent = `Status: ${donation.status}`;

            card.append(title, category, quantity, condition, status);

            donationsContainer.appendChild(card);
        });

    } catch (error) {
        donationsMessage.textContent = error.message;
        donationsMessage.style.color = "red";
    }
}

loadMyDonations();
