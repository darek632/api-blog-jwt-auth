const { body, validationResult } = require("express-validator");
const db = require("../db/queries");



// handling undefined limit 
// if i do number(undefined) will be nan which wont be accepted by prisma

function parseLimit(value) {
  if (value === undefined) return undefined;
  const limit = Number(value);
  return Number.isInteger(limit) && limit > 0 ? limit : undefined;

  // covers for more than just NaN from doing number() on undefined.

}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}


//validation helper

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

const validatePost = [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ max: 200 }).withMessage("Title must be 200 characters or fewer"),
  body("content")
    .trim()
    .notEmpty().withMessage("Content is required"),
];

const validateComment = [
  body("content")
    .trim()
    .notEmpty().withMessage("Comment cannot be empty")
    .isLength({ max: 1000 }).withMessage("Comment must be 1000 characters or fewer"),
];

exports.getPublishedPosts = async (req, res) => {

   const limit = parseLimit(req.query.limit);

    const posts = await db.getPublishedPosts(limit);

    res.json(posts);

}

exports.getAllPosts = async (req,res) => { 
    const limit = parseLimit(req.query.limit);
    const posts = await db.getAllPosts(limit);

    res.json(posts);
}

exports.getPost = async (req, res) => {
  const postId = parseId(req.params.postId);
  if (!postId) return res.status(400).json({ error: "Invalid post id" });
 
  const post = await db.getPostById(postId);
  if (!post) return res.status(404).json({ error: "Post not found" });
 
  res.json(post);
}

exports.createPost = [
    validatePost,
    handleValidation,
    async (req,res) => { 


    const {title, content } = req.body;
    const post = await db.createPost(req.user.id, title,content);

    res.status(201).json(post);
}
]


exports.updatePost = [
    validatePost,
    handleValidation,
    async (req,res) => { 
        const postId = parseId(req.params.postId);
        if(!postId) return res.status(400).json({error: "invalid post id"});

        const {title, content } = req.body;
        const post = await db.editPost(postId, title, content);

        res.json(post);
    },
];

exports.togglePublish = async (req, res) => {
  const postId = parseId(req.params.postId);
  if (!postId) return res.status(400).json({ error: "Invalid post id" });
 
  const post = await db.togglePublish(postId);
  if (!post) return res.status(404).json({ error: "Post not found" });
 
  res.json(post);
}

exports.deletePost =  async (req, res) => {
  const postId = parseId(req.params.postId);
  if (!postId) return res.status(400).json({ error: "Invalid post id" });
 
  await db.deletePost(postId);
  res.status(204).end(); // 204 = success, nothing to send back
}

// comments

exports.createComment = [
  ...validateComment,
  handleValidation,
  async (req, res) => {
    const postId = parseId(req.params.postId);
    if (!postId) return res.status(400).json({ error: "Invalid post id" });
 
    // Only allow comments on posts that exist and are published
    const post = await db.getPostById(postId);
    if (!post || !post.published) {
      return res.status(404).json({ error: "Post not found" });
    }
 
    const comment = await db.createComment(postId, req.user.id, req.body.content);
    res.status(201).json(comment);
  },
];
 
// DELETE /posts/:postId/comments/:commentId
exports.deleteComment =  async (req, res) => {

  // need to check if userId matches the author of comment OR 
  // if user isAuthor, so that anyone can delete their own comments only. 

  const postId = parseId(req.params.postId); 
  const commentId = parseId(req.params.commentId);


  if (!commentId || !postId) return res.status(400).json({ error: "Invalid id" });

  const comment = await db.getCommentById(commentId);
  if(!comment || comment.postId !== postId) {
    return res.status(404).json({error: "comment not found"});
  }

  const isOwner = comment.authorId === req.user.id;

  //only passes if is not an owner of comment and is not an author, which is the only case when you can't delete comments. 
  // if author AND OWNER YOU CAN
  // if OWNER (of comment) YOU CAN
  // if NOT OWNER BUT AUTHOR YOU CAN 
  // if NOT OWNER AND NOT AUTHOR YOU CANNOT
  if (!isOwner && !req.user.isAuthor) {
    return res.status(403).json({error: "You can only delete your own comments"});
  }
 
  await db.deleteComment(commentId);
  res.status(204).end();
}




