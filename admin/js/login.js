import { api, saveLogin, getToken, getUser } from "./api.js";
import { showMessage, showError } from "./ui.js";

// Already logged in as an author? Skip straight to the dashboard
if (getToken() && getUser()?.isAuthor) {
  location.replace("index.html");
}

const form = document.getElementById("login-form");
const status = document.getElementById("form-status");

if (new URLSearchParams(location.search).get("expired")) {
  showMessage(status, "Your session has expired. Please log in again.", "info");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;

  const { username, password } = Object.fromEntries(new FormData(form));

  try {
    const data = await api("/auth/log-in", { method: "POST", body: { username, password } });

    if (!data.user?.isAuthor) {
      showMessage(status, "This account doesn't have author access.");
      button.disabled = false;
      return;
    }

    saveLogin(data.token, data.user);
    location.href = "index.html";
  } catch (err) {
    showError(status, err);
    button.disabled = false;
  }
});
