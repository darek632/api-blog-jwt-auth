import { api, getUser } from "./api.js";
import { renderNav, el, formatDate, plural, showMessage, showError, SITE_NAME } from "./ui.js";

renderNav();

const postId = new URLSearchParams(location.search).get("id");
const article = document.getElementById("post");
const commentsSection = document.getElementById("comments");
const user = getUser();

if (!postId) {
  showMessage(article, "No post selected.");
} else {
  loadPost();
}

async function loadPost() {
  try {
    const post = await api(`/posts/${encodeURIComponent(postId)}`);
    if (!post.published) {
      showMessage(article, "Sorry, that post doesn't exist.");
      return;
    }
    renderPost(post);
    renderComments(post);
  } catch (err) {
    showMessage(
      article,
      err.status === 404 || err.status === 400
        ? "Sorry, that post doesn't exist."
        : `Couldn't load this post. (${err.message})`
    );
  }
}

function renderPost(post) {
  document.title = `${post.title} · ${SITE_NAME}`;
  article.replaceChildren(
    el("p", { class: "meta" }, `${formatDate(post.createdAt)} · ${post.author.username}`),
    el("h1", {}, post.title),
    el("div", { class: "post-body" }, post.content)
  );
}

function renderComments(post) {
  const list = el("ul", { class: "comment-list" });
  const heading = el("h2", {});

  function updateHeading() {
    const count = list.children.length;
    heading.textContent = count ? plural(count, "comment") : "No comments yet";
  }

  for (const comment of post.comments) {
    list.append(commentItem(comment, updateHeading));
  }
  updateHeading();

  commentsSection.replaceChildren(
    heading,
    list,
    user ? commentForm(post.id, list, updateHeading) : loginPrompt(post.id)
  );
  commentsSection.hidden = false;
}

function commentItem(comment, onRemoved) {
  const item = el(
    "li",
    { class: "comment" },
    el("p", { class: "meta" }, el("strong", {}, comment.author.username), ` · ${formatDate(comment.createdAt)}`),
    el("p", { class: "comment-body" }, comment.content)
  );

  // Only shows the button; the API still makes the real decision
  const canDelete = user && (user.id === comment.authorId || user.isAuthor);
  if (canDelete) {
    const button = el("button", { type: "button", class: "link-button danger" }, "Delete");
    button.addEventListener("click", async () => {
      if (!confirm("Delete this comment?")) return;
      button.disabled = true;
      try {
        await api(`/posts/${comment.postId}/comments/${comment.id}`, { method: "DELETE" });
        item.remove();
        onRemoved();
      } catch (err) {
        button.disabled = false;
        alert(err.message);
      }
    });
    item.append(button);
  }

  return item;
}

function commentForm(postId, list, onAdded) {
  const textarea = el("textarea", {
    id: "comment-content",
    name: "content",
    rows: "4",
    maxlength: "1000",
    required: "",
    placeholder: "Share your thoughts…",
  });
  const status = el("div");
  const button = el("button", { type: "submit", class: "button" }, "Post comment");

  const form = el(
    "form",
    { class: "comment-form" },
    el("label", { for: "comment-content" }, `Commenting as ${user.username}`),
    textarea,
    status,
    button
  );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    button.disabled = true;
    status.replaceChildren();
    try {
      const comment = await api(`/posts/${postId}/comments`, {
        method: "POST",
        body: { content: textarea.value },
      });
      if (!comment.author) comment.author = { username: user.username };
      list.append(commentItem(comment, onAdded));
      onAdded();
      textarea.value = "";
    } catch (err) {
      if (err.status === 401) {
        showMessage(status, "Your session has expired. Please log in again.");
      } else {
        showError(status, err);
      }
    } finally {
      button.disabled = false;
    }
  });

  return form;
}

function loginPrompt(postId) {
  const next = encodeURIComponent(`post.html?id=${postId}`);
  return el(
    "p",
    { class: "login-prompt" },
    el("a", { href: `login.html?next=${next}` }, "Log in"),
    " or ",
    el("a", { href: `signup.html?next=${next}` }, "sign up"),
    " to join the conversation."
  );
}
