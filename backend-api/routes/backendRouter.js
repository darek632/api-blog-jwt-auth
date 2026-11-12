const { Router } = require("express");
const path = require("node:path");
const backendController = require("../controllers/backendController");
const backendRouter = Router();

const { requireAuth, requireAuthor } = require("../middleware/auth");
// const uploadFile = require("../middleware/upload");

// const isAuth = require("../middleware/auth");


// public reader routes

backendRouter.get("/posts", backendController.getPublishedPosts); // a route to get all posts
backendRouter.get("/posts/drafts",requireAuth, requireAuthor, backendController.getAllPosts); // **in author view only** // get unpublished posts
backendRouter.get("/posts/:postId", backendController.getPost); // individual post and it's related comments below



//author frontend routes
backendRouter.post("/posts",requireAuth, requireAuthor, backendController.createPost); 
backendRouter.put("/posts/:postId",requireAuth, requireAuthor, backendController.updatePost); // for edit form
backendRouter.patch("/posts/:postId/publish", requireAuth, requireAuthor, backendController.togglePublish); // only changing one attribute so patch rather than put
backendRouter.delete("/posts/:postId", requireAuth, requireAuthor, backendController.deletePost);



//comments

backendRouter.post("/posts/:postId/comments", requireAuth, backendController.createComment);
backendRouter.delete("/posts/:postId/comments/:commentId", requireAuth, backendController.deleteComment);







module.exports = backendRouter;
