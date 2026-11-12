import { getUser, logout } from "./api.js";

export const SITE_NAME = "Hobbit's tales"; // rename your blog here (and in the <h1> on index.html)

// Builds an element. Strings passed as children become text, never HTML,
// so post and comment content can't inject scripts into the page.
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

export function excerpt(text, length = 180) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length).trimEnd()}…` : clean;
}

export function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function showMessage(container, text, type = "error") {
  container.replaceChildren(
    el("p", { class: `message message-${type}`, role: type === "error" ? "alert" : "status" }, text)
  );
}

// Shows validation errors as a list when the API sends several
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

// Only allow redirects to our own pages, e.g. "post.html?id=3"
export function safeNext(next, fallback = "index.html") {
  return next && /^[\w-]+\.html(\?[\w=&-]*)?$/.test(next) ? next : fallback;
}

export function renderNav() {
  const header = document.getElementById("site-header");
  const user = getUser();

  const links = el("nav", { class: "nav-links" }, el("a", { href: "posts.html" }, "All posts"));

  if (user) {
    links.append(
      el("span", { class: "nav-user" }, `Hi, ${user.username}`),
      el(
        "button",
        {
          type: "button",
          class: "link-button",
          onclick: () => {
            logout();
            location.reload();
          },
        },
        "Log out"
      )
    );
  } else {
    links.append(
      el("a", { href: "login.html" }, "Log in"),
      el("a", { href: "signup.html", class: "button button-small" }, "Sign up")
    );
  }

  header.replaceChildren(
    el("div", { class: "container header-inner" }, el("a", { href: "index.html", class: "logo" }, SITE_NAME), links)
  );
}

export function postCard(post) {
  const url = `post.html?id=${post.id}`;
  return el(
    "article",
    { class: "card" },
    el("p", { class: "meta" }, `${formatDate(post.createdAt)} · ${post.author.username}`),
    el("h3", {}, el("a", { href: url }, post.title)),
    el("p", {}, excerpt(post.content)),
    el("a", { href: url, class: "read-more" }, "Read post →")
  );
}
