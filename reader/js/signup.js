import { api, saveLogin } from "./api.js";
import { renderNav, showError, safeNext } from "./ui.js";

renderNav();

const form = document.getElementById("signup-form");
const status = document.getElementById("form-status");
const next = new URLSearchParams(location.search).get("next");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;

  const { username, password, confirmPassword } = Object.fromEntries(new FormData(form));

  try {
    const data = await api("/auth/sign-up", {
      method: "POST",
      body: { username, password, confirmPassword },
    });

    if (data.token) {
      // If your sign-up route returns a token, log straight in
      saveLogin(data.token, data.user);
      location.href = safeNext(next);
    } else {
      // Otherwise send them to log in
      const nextParam = next ? `&next=${encodeURIComponent(next)}` : "";
      location.href = `login.html?registered=1${nextParam}`;
    }
  } catch (err) {
    showError(status, err);
    button.disabled = false;
  }
});
