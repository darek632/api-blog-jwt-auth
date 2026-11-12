import { getToken, getUser, logout, READER_URL } from "./api.js";

export const SITE_NAME = "Hobbit's tales";

// Builds an element. Strings passed as children become text, never HTML.
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child !== null && child !== undefined) node.append(child);
  }
  return node;
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function showMessage(container, text, type = "error") {
  container.replaceChildren(
    el("p", { class: `message message-${type}`, role: type === "error" ? "alert" : "status" }, text)
  );
}

export function showError(container, err) {
  if (err.details && err.details.length > 1) {
    container.replaceChildren(
      el(
        "div",
        { class: "message message-error", role: "alert" },
        el("ul", { class: "error-list" }, ...err.details.map((d) => el("li", {}, d.msg)))
      )
    );
  } else {
    showMessage(container, err.message);
  }
}

// Every page except login calls this first. Not logged in as an author? Back to login.
// (This only hides pages; the API's requireAuthor is the real protection.)
export function requireAuthor() {
  const user = getUser();
  if (!getToken() || !user?.isAuthor) {
    location.replace("login.html");
    return false;
  }
  return true;
}

// For failed button actions: an auth failure means the token expired, so go to login
export function actionError(err) {
  if (err.status === 401 || err.status === 403) {
    logout();
    location.replace("login.html?expired=1");
    return;
  }
  alert(err.message);
}

// For failed page loads: same, but show other errors on the page
export function loadError(err, container) {
  if (err.status === 401 || err.status === 403) {
    logout();
    location.replace("login.html?expired=1");
    return;
  }
  showError(container, err);
}

export function renderNav() {
  const header = document.getElementById("site-header");
  const user = getUser();

  header.replaceChildren(
    el(
      "div",
      { class: "container header-inner" },
      el("a", { href: "index.html", class: "logo" }, SITE_NAME, el("span", { class: "logo-tag" }, "Author")),
      el(
        "nav",
        { class: "nav-links" },
        el("a", { href: "index.html" }, "Dashboard"),
        el("a", { href: "editor.html" }, "New post"),
        el("a", { href: READER_URL, target: "_blank", rel: "noopener" }, "View blog ↗"),
        el("span", { class: "nav-user" }, user.username),
        el(
          "button",
          {
            type: "button",
            class: "link-button",
            onclick: () => {
              logout();
              location.href = "login.html";
            },
          },
          "Log out"
        )
      )
    )
  );
}
