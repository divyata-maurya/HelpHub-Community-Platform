
/*
 * HelpHub frontend configuration.
 * Local development uses backend on port 5000.
 * Production uses the same domain as the frontend.
 */

const isLocal = 
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

const BACKEND_URL = isLocal
    ? "http://localhost:5000"
    : window.location.origin;

window.HELPHUB_CONFIG = Object.freeze({
    API_BASE_URL: `${BACKEND_URL}/api/v1`,
    BACKEND_URL: BACKEND_URL
});
