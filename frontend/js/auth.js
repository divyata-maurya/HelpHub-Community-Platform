
const API_BASE_URL = window.HELPHUB_CONFIG.API_BASE_URL;

function showMessage(message, isError = true) {
    const element = document.getElementById("message");

    if (element) {
        element.textContent = message;
        element.style.color = isError ? "#dc2626" : "#16a34a";
    }
}


// LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed.");
            }

            if (!data.token || !data.user || !data.user.role) {
                throw new Error("Invalid login response.");
            }

            sessionStorage.setItem("token", data.token);
            sessionStorage.setItem("user", JSON.stringify(data.user));

            showMessage("Login successful!", false);

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 500);

        } catch (error) {
            showMessage(error.message);
        }
    });
}

// REGISTER
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const role = document.getElementById("role").value;

        if (password !== confirmPassword) {
            showMessage("Passwords do not match.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    password,
                    role
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed.");
            }

            showMessage("Account created successfully! Please login.", false);

            registerForm.reset();

        } catch (error) {
            showMessage(error.message);
        }
    });
}
