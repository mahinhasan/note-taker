const Post = require('../models/Post');
const ApiError = require('../utils/ApiError');
const { paginateById } = require('../utils/pagination');

const AUTHOR = { path: 'author', select: 'name' };

function canModify(actor, post) {
  return actor.role === 'admin' || String(post.author) === String(actor._id);
}

async function findModifiablePost(actor, id) {
  const post = await Post.findById(id);
  if (!post) throw ApiError.notFound('Post not found');
  if (!canModify(actor, post)) throw ApiError.forbidden('You can only modify your own posts');
  return post;
}

function listPosts({ limit, after, author }) {
  const filter = author ? { author } : {};
  return paginateById(Post, filter, { limit, after, populate: AUTHOR });
}

async function createPost(actor, { title, body }) {
  const post = await Post.create({ author: actor._id, title, body });
  return post.populate(AUTHOR);
}

async function getPost(id) {
  const post = await Post.findById(id).populate(AUTHOR);
  if (!post) throw ApiError.notFound('Post not found');
  return post;
}

async function updatePost(actor, id, { title, body }) {
  const post = await findModifiablePost(actor, id);
  if (title !== undefined) post.title = title;
  if (body !== undefined) post.body = body;
  await post.save();
  return post.populate(AUTHOR);
}

async function deletePost(actor, id) {
  const post = await findModifiablePost(actor, id);
  await Post.deleteOne({ _id: post._id });
  return post;
}

module.exports = { listPosts, createPost, getPost, updatePost, deletePost };
