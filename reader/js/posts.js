import { api } from "./api.js";
import { renderNav, postCard, showMessage } from "./ui.js";

renderNav();

const container = document.getElementById("post-list");

try {
  const posts = await api("/posts");
  if (posts.length === 0) {
    showMessage(container, "No posts yet. Check back soon!", "info");
  } else {
    container.replaceChildren(...posts.map(postCard));
  }
} catch (err) {
  showMessage(container, `Couldn't load posts. Is the API running? (${err.message})`);
}
