const postService = require('../services/post.service');

async function listPosts(req, res) {
  res.json(await postService.listPosts(req.valid.query));
}

async function createPost(req, res) {
  const post = await postService.createPost(req.user, req.valid.body);
  res.status(201).json({ data: post });
}

async function getPost(req, res) {
  const post = await postService.getPost(req.valid.params.id);
  res.json({ data: post });
}

async function updatePost(req, res) {
  const post = await postService.updatePost(req.user, req.valid.params.id, req.valid.body);
  res.json({ data: post });
}

async function deletePost(req, res) {
  await postService.deletePost(req.user, req.valid.params.id);
  res.status(204).end();
}

module.exports = { listPosts, createPost, getPost, updatePost, deletePost };
