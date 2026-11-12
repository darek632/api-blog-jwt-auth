// Where your Express API is running
const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);

export const API_URL = isLocal ? "http://localhost:3000" : "https://api-blog-jwt-auth.onrender.com";
// Where your reader site runs (used for "View on blog" links)
export const READER_URL = isLocal ? "http://127.0.0.1:5500/reader" : "https://api-blog-jwt-auth-1.onrender.com"

// ---------- token + user storage ----------

export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export function saveLogin(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// ---------- one function for every API call ----------
// Adds the JSON header and the token (if logged in), parses the response,
// and throws an Error with a readable message when the API says no.
export async function api(path, { method = "GET", body } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null; // success, nothing sent back (e.g. deletes)

  // Most responses are JSON, but passport's 401 is plain text, so read text first
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    if (res.status === 401 && token) logout(); // token expired or invalid
    const error = new Error(errorMessage(data, res.status));
    error.status = res.status;
    error.details = data?.errors || []; // express-validator errors
    throw error;
  }

  return data;
}

function errorMessage(data, status) {
  if (data?.errors?.length) return data.errors.map((e) => e.msg).join(". ");
  if (data?.error) return data.error;
  if (status === 401) return "Please log in to do that.";
  return "Something went wrong. Please try again.";
}
