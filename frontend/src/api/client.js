const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

// Token persistence: this is a real standalone app running in the user's
// own browser (not a Claude-artifact preview), so localStorage is the
// correct, standard choice for keeping a login across page refreshes.
export function getAccessToken() {
  return localStorage.getItem("pp360_access_token");
}

export function getRefreshToken() {
  return localStorage.getItem("pp360_refresh_token");
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem("pp360_access_token", access);
  if (refresh) localStorage.setItem("pp360_refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("pp360_access_token");
  localStorage.removeItem("pp360_refresh_token");
}

function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    // Token expired/invalid — clear it and force back to login rather
    // than showing a confusing generic error.
    clearTokens();
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.detail || JSON.stringify(body) || `${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

// For endpoints that return a binary file (PDF) rather than JSON.
async function requestBlob(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.blob();
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: "POST", body: JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: "DELETE" }),
  getBlob: (path) => requestBlob(path),
};
