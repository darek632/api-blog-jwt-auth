const prisma = require("./prisma"); 

const authorName = { select: { username: true } };


async function createUser(username,password) { 
  return prisma.user.create({data: {username, password}});
}

async function getUserByUsername(username) {
    return prisma.user.findUnique({ where: { username } });
}

async function getUserById(userId) { 
  return prisma.user.findUnique({
    where: {id: userId},
    select: {id:true, username: true, isAuthor: true},
  });
}



async function getPublishedPosts(limit) { 
    return prisma.post.findMany({
        where: {published: true},
        orderBy: {createdAt: "desc"},
        take: limit,
        include: {author: authorName},
        // include: {author: true} for all columns from the related table, otherwise  'select' which specific ones
    });
}

async function getAllPosts(limit) { 
    return prisma.post.findMany({
        orderBy: {createdAt: "desc"},
        take: limit,
        include: {
            author: authorName,
            _count: {select: {comments: true}}
        },
        // include: {author: true} for all columns from the related table, otherwise  'select' which specific ones

    });

}

async function getPostById(postId) {
  return prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: authorName,
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: authorName },
      },
    },
  });
}

async function createPost(authorId, title, content) {
  return prisma.post.create({
    data: { title, content, authorId },
  });
}

async function editPost(postId,title,content) { 
   return prisma.post.update({
    where: { id: postId },
    data: { title, content },
  }); 

}

async function togglePublish(postId) { 
    
    const post = prisma.post.findUnique({
        where: {id: postId},
        select: {published:true}, 
        // this is saying select the published column NOT select published posts. 
    })
    if(!post) return null;
    // dealing with single rows so need a quiet failure check

    return prisma.post.update({
        where: {id: postId},
        data: {published: !post.published},
    })

}

async function deletePost(postId) { 
    return prisma.post.delete({
        where: {id:postId},
    });

}

async function getAllComments(postId) {
  return prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: { author: authorName },
  });
}

async function createComment(postId, authorId, content) {
  return prisma.comment.create({
    data: { content, postId, authorId },
    include: { author: authorName },
  });
}

async function getCommentById(commentId) {
  return prisma.comment.findUnique({ where: { id: commentId } });
}

async function deleteComment(commentId) {
  return prisma.comment.delete({
    where: { id: commentId },
  });
}



module.exports = {
  createUser,
  getUserByUsername,
  getUserById,
  getPublishedPosts,
  getPostById,
  getAllPosts,
  createPost,
  editPost,
  togglePublish,
  deletePost,
  getAllComments,
  createComment,
  getCommentById,
  deleteComment,
};

