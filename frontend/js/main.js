
/* =================================
   HELP HUB - MAIN JAVASCRIPT
================================= */

document.addEventListener("DOMContentLoaded", () => {
    console.log("HelpHub Frontend Loaded Successfully!");

    const navButtons = document.getElementById("navButtons");

    if (!navButtons) return;

    const token = sessionStorage.getItem("token");
    let user = null;

    try {
        user = JSON.parse(sessionStorage.getItem("user"));
    } catch (error) {
        sessionStorage.removeItem("user");
    }

    // Show login and registration when logged out
    if (!token || !user) {
        navButtons.innerHTML = `
            <a href="pages/login.html" class="login-btn">Login</a>
            <a href="pages/register.html" class="btn">Get Started</a>
        `;
        return;
    }

    // Show logged-in user information
    const welcomeText = document.createElement("span");
    welcomeText.textContent =
        `Welcome, ${user.name} (${user.role})`;

    const logoutButton = document.createElement("button");
    logoutButton.textContent = "Logout";
    logoutButton.className = "login-btn";
    logoutButton.type = "button";

    logoutButton.addEventListener("click", () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.reload();
    });

    navButtons.replaceChildren(welcomeText, logoutButton);
});
