import { api, saveLogin } from "./api.js";
import { renderNav, showMessage, showError, safeNext } from "./ui.js";

renderNav();

const form = document.getElementById("login-form");
const status = document.getElementById("form-status");
const params = new URLSearchParams(location.search);

if (params.get("registered")) {
  showMessage(status, "Account created. You can log in now.", "success");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;

  const { username, password } = Object.fromEntries(new FormData(form));

  try {
    const data = await api("/auth/log-in", { method: "POST", body: { username, password } });
    saveLogin(data.token, data.user);
    location.href = safeNext(params.get("next"));
  } catch (err) {
    showError(status, err);
    button.disabled = false;
  }
});
