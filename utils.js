// const HOST = "http://127.0.0.1:8000";
const HOST = "https://schedulify-backend-gemx.onrender.com/"

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// --- TOKEN STORAGE ---
function setTokens(access, refresh) {
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
}

function getUserData() {
    const data = localStorage.getItem("user_data");
    return data ? JSON.parse(data) : null;
}

async function setUserData(){
    const res = await authFetch(`${HOST}/api/auth/me/`);
    const data = await res.json();
    localStorage.setItem("user_data", JSON.stringify(data));
}

function clearData() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user_data");
    window.location.href = "login.html";
}

function getAccess() {
    return localStorage.getItem("access");
}

function getRefresh() {
    return localStorage.getItem("refresh");
}

// --- AUTOMATIC TOKEN REFRESH ---
async function refreshAccessToken() {
    const refresh = getRefresh();
    if (!refresh) return null;

    const res = await fetch(`${HOST}/api/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh })
    });

    if (!res.ok) return null;

    const data = await res.json();
    setTokens(data.access, data.refresh);
    setUserData();
    return data.access;
}

// --- WRAPPER FOR AUTH REQUESTS ---
async function authFetch(url, options = {}) {
    // ensure options + headers exist
    if (!options.headers) options.headers = {};

    // Add JSON content-type ONLY if not uploading FormData
    if (!(options.body instanceof FormData)) {
        options.headers["Content-Type"] = "application/json";
    }

    // Attach access token
    options.headers["Authorization"] = "Bearer " + getAccess();

    let res = await fetch(url, options);

    // Try refresh on auth failure
    if (res.status === 401 || res.status === 403) {
        const newAccess = await refreshAccessToken();
        if (!newAccess) return res;

        options.headers["Authorization"] = "Bearer " + newAccess;

        res = await fetch(url, options);
    }

    return res;
}