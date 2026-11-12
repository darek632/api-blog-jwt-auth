import { api } from "./api.js";
import { requireAuthor, renderNav, el, formatDate, plural, actionError, loadError } from "./ui.js";

const container = document.getElementById("post-list");

if (requireAuthor()) {
  renderNav();
  loadPosts();
}

async function loadPosts() {
  try {
    // Your API's author-only route that returns drafts AND published posts
    const posts = await api("/posts/drafts");
    if (posts.length === 0) {
      renderEmpty();
    } else {
      container.replaceChildren(el("ul", { class: "post-rows" }, ...posts.map(postRow)));
    }
  } catch (err) {
    loadError(err, container);
  }
}

function renderEmpty() {
  container.replaceChildren(
    el(
      "div",
      { class: "empty" },
      el("p", {}, "You haven't written any posts yet."),
      el("a", { href: "editor.html", class: "button" }, "Write your first post")
    )
  );
}

function postRow(post) {
  const badge = el("span");
  const publishButton = el("button", { type: "button", class: "button button-small button-secondary" });
  const deleteButton = el("button", { type: "button", class: "button button-small button-danger" }, "Delete");
  const commentCount = post._count?.comments ?? 0;

  function showStatus() {
    badge.className = `badge ${post.published ? "badge-live" : "badge-draft"}`;
    badge.textContent = post.published ? "Published" : "Draft";
    publishButton.textContent = post.published ? "Unpublish" : "Publish";
  }
  showStatus();

  const row = el(
    "li",
    { class: "post-row" },
    el(
      "div",
      { class: "post-row-main" },
      el("a", { href: `editor.html?id=${post.id}`, class: "post-row-title" }, post.title),
      el("p", { class: "meta" }, `${formatDate(post.createdAt)} · ${plural(commentCount, "comment")}`)
    ),
    badge,
    el(
      "div",
      { class: "post-row-actions" },
      publishButton,
      el("a", { href: `editor.html?id=${post.id}`, class: "button button-small button-secondary" }, "Edit"),
      deleteButton
    )
  );

  publishButton.addEventListener("click", async () => {
    publishButton.disabled = true;
    try {
      const updated = await api(`/posts/${post.id}/publish`, { method: "PATCH" });
      post.published = updated.published;
      showStatus();
    } catch (err) {
      actionError(err);
    } finally {
      publishButton.disabled = false;
    }
  });

  deleteButton.addEventListener("click", async () => {
    if (!confirm(`Delete "${post.title}"? Its comments will be deleted too. This can't be undone.`)) return;
    deleteButton.disabled = true;
    try {
      await api(`/posts/${post.id}`, { method: "DELETE" });
      row.remove();
      if (!container.querySelector(".post-row")) renderEmpty();
    } catch (err) {
      deleteButton.disabled = false;
      actionError(err);
    }
  });

  return row;
}
