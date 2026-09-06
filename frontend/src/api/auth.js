import { api, setTokens, clearTokens, getAccessToken } from "./client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export async function login(username, password) {
  const res = await fetch(`${BASE_URL}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Incorrect username or password.");
  const data = await res.json();
  setTokens({ access: data.access, refresh: data.refresh });
  return data;
}

export function logout() {
  clearTokens();
}

export function isLoggedIn() {
  return !!getAccessToken();
}

export function fetchCurrentUser() {
  return api.get("/accounts/users/me/");
}
