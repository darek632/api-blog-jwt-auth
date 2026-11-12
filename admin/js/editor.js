import { api, READER_URL } from "./api.js";
import {
  requireAuthor,
  renderNav,
  el,
  formatDate,
  plural,
  showMessage,
  showError,
  actionError,
  loadError,
} from "./ui.js";

// editor.html          -> new post
// editor.html?id=5     -> edit post 5
const params = new URLSearchParams(location.search);
const postId = params.get("id");

const pageTitle = document.getElementById("page-title");
const pageStatus = document.getElementById("page-status");
const actions = document.getElementById("editor-actions");
const form = document.getElementById("post-form");
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const formStatus = document.getElementById("form-status");
const saveButton = document.getElementById("save-button");
const commentsSection = document.getElementById("comments");

let post = null; // the post being edited, once loaded

if (requireAuthor()) {
  renderNav();
  init();
}

async function init() {
  if (!postId) {
    pageTitle.textContent = "New post";
    document.title = "New post · Author";
    form.hidden = false;
    titleInput.focus();
    return;
  }

  pageTitle.textContent = "Edit post";
  try {
    post = await api(`/posts/${encodeURIComponent(postId)}`);
    titleInput.value = post.title;
    contentInput.value = post.content;
    form.hidden = false;
    renderActions();
    renderComments();
    if (params.get("created")) {
      showMessage(formStatus, "Post created. It stays a draft until you publish it.", "success");
    }
  } catch (err) {
    if (err.status === 404 || err.status === 400) {
      showMessage(pageStatus, "That post doesn't exist.");
    } else {
      loadError(err, pageStatus);
    }
  }
}

// ---------- save (create or update) ----------

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  saveButton.disabled = true;
  formStatus.replaceChildren();

  const body = { title: titleInput.value, content: contentInput.value };

  try {
    if (post) {
      const updated = await api(`/posts/${post.id}`, { method: "PUT", body });
      post = { ...post, ...updated };
      renderActions();
      showMessage(formStatus, "Changes saved.", "success");
    } else {
      const created = await api("/posts", { method: "POST", body });
      location.href = `editor.html?id=${created.id}&created=1`;
      return; // keep the button disabled while the page changes
    }
  } catch (err) {
    if (err.status === 401 || err.status === 403) return actionError(err);
    showError(formStatus, err);
  }
  saveButton.disabled = false;
});

// ---------- status bar: publish, view, delete ----------

function renderActions() {
  const badge = el(
    "span",
    { class: `badge ${post.published ? "badge-live" : "badge-draft"}` },
    post.published ? "Published" : "Draft"
  );

  const publishButton = el(
    "button",
    { type: "button", class: "button button-small button-secondary", onclick: togglePublish },
    post.published ? "Unpublish" : "Publish"
  );

  const deleteButton = el(
    "button",
    { type: "button", class: "button button-small button-danger", onclick: deletePost },
    "Delete post"
  );

  const items = [badge, publishButton];
  if (post.published) {
    items.push(
      el(
        "a",
        {
          href: `${READER_URL}/post.html?id=${post.id}`,
          target: "_blank",
          rel: "noopener",
          class: "button button-small button-secondary",
        },
        "View on blog ↗"
      )
    );
  }
  items.push(deleteButton);

  actions.replaceChildren(...items);
  actions.hidden = false;
}

async function togglePublish(event) {
  event.currentTarget.disabled = true;
  try {
    const updated = await api(`/posts/${post.id}/publish`, { method: "PATCH" });
    post.published = updated.published;
    renderActions(); // redraws the buttons, so no need to re-enable
  } catch (err) {
    renderActions();
    actionError(err);
  }
}

async function deletePost(event) {
  if (!confirm("Delete this post and all its comments? This can't be undone.")) return;
  const button = event.currentTarget;
  button.disabled = true;
  try {
    await api(`/posts/${post.id}`, { method: "DELETE" });
    location.href = "index.html";
  } catch (err) {
    button.disabled = false;
    actionError(err);
  }
}

// ---------- comment moderation ----------

function renderComments() {
  const list = el("ul", { class: "comment-list" });
  const heading = el("h2");

  function updateHeading() {
    const count = list.children.length;
    heading.textContent = count ? plural(count, "comment") : "No comments yet";
  }

  for (const comment of post.comments ?? []) {
    const item = el(
      "li",
      { class: "comment" },
      el("p", { class: "meta" }, el("strong", {}, comment.author.username), ` · ${formatDate(comment.createdAt)}`),
      el("p", { class: "comment-body" }, comment.content)
    );

    const button = el("button", { type: "button", class: "link-button danger" }, "Delete comment");
    button.addEventListener("click", async () => {
      if (!confirm("Delete this comment?")) return;
      button.disabled = true;
      try {
        await api(`/posts/${post.id}/comments/${comment.id}`, { method: "DELETE" });
        item.remove();
        updateHeading();
      } catch (err) {
        button.disabled = false;
        actionError(err);
      }
    });

    item.append(button);
    list.append(item);
  }

  updateHeading();
  commentsSection.replaceChildren(heading, list);
  commentsSection.hidden = false;
}
