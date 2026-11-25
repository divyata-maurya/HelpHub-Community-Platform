
const API_BASE_URL = window.HELPHUB_CONFIG.API_BASE_URL;

const donationForm = document.getElementById("donationForm");

if (donationForm) {
    donationForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const token = sessionStorage.getItem("token");
        const message = document.getElementById("donationMessage");
        const imageInput = document.getElementById("images");

        if (!token) {
            message.textContent = "Please login first.";
            message.style.color = "red";
            return;
        }

        // Validate image count
        if (imageInput.files.length > 5) {
            message.textContent = "You can upload a maximum of 5 images.";
            message.style.color = "red";
            return;
        }

        // Validate image size (5 MB per image)
        for (const file of imageInput.files) {
            if (file.size > 5 * 1024 * 1024) {
                message.textContent = `${file.name} exceeds the 5 MB limit.`;
                message.style.color = "red";
                return;
            }
        }

        const formData = new FormData();

        formData.append("title", document.getElementById("title").value.trim());
        formData.append("description", document.getElementById("description").value.trim());
        formData.append("category", document.getElementById("category").value);
        formData.append("quantity", document.getElementById("quantity").value);
        formData.append("unit", document.getElementById("unit").value.trim());
        formData.append("condition", document.getElementById("condition").value);

        const location = {
            address: document.getElementById("address").value.trim(),
            city: document.getElementById("city").value.trim(),
            state: document.getElementById("state").value.trim(),
            country: document.getElementById("country").value.trim(),
            postalCode: document.getElementById("postalCode").value.trim()
        };

        formData.append("location", JSON.stringify(location));

        const expiryDate = document.getElementById("expiryDate").value;

        if (expiryDate) {
            formData.append("expiryDate", expiryDate);
        }

        // Append images using the backend's expected field name
        for (const file of imageInput.files) {
            formData.append("images", file);
        }

        try {
            message.textContent = "Submitting donation...";
            message.style.color = "#2563eb";

            const response = await fetch(`${API_BASE_URL}/donations`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Donation submission failed.");
            }

            message.textContent =
                data.message || "Donation submitted successfully!";
            message.style.color = "green";

            donationForm.reset();

        } catch (error) {
            message.textContent = error.message;
            message.style.color = "red";
        }
    });
}
