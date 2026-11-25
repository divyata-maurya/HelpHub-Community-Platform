document.addEventListener("DOMContentLoaded", function () {

    // Find the page header
    const header = document.querySelector("header");

    if (!header) return;

    // Prevent duplicate buttons
    if (document.querySelector(".app-back-btn")) return;

    // Create Back button
    const backButton = document.createElement("button");

    backButton.type = "button";
    backButton.className = "app-back-btn";
    backButton.innerHTML = "&#8592; Back";

    // Add button at the beginning of header
    header.prepend(backButton);

    backButton.addEventListener("click", function () {

        const currentPage = window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

        // Dashboard fallback goes to homepage
        const fallbackPage = currentPage === "dashboard.html"
            ? "../index.html"
            : "dashboard.html";

        // Go back if previous page belongs to this website
        if (
            document.referrer &&
            new URL(document.referrer).origin === window.location.origin &&
            document.referrer !== window.location.href
        ) {
            window.history.back();
        } else {
            // If page was opened directly
            window.location.href = fallbackPage;
        }

    });

});