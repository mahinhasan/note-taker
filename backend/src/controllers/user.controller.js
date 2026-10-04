const userService = require('../services/user.service');

function getMe(req, res) {
  res.json({ data: req.user });
}

async function updateMe(req, res) {
  const user = await userService.updateMe(req.user, req.valid.body);
  res.json({ data: user });
}

async function listUsers(req, res) {
  res.json(await userService.listUsers(req.valid.query));
}

async function createUser(req, res) {
  const user = await userService.createUser(req.valid.body);
  res.status(201).json({ data: user });
}

async function getUser(req, res) {
  const user = await userService.findUserOrFail(req.valid.params.id);
  res.json({ data: user });
}

async function updateUser(req, res) {
  const user = await userService.updateUser(req.user, req.valid.params.id, req.valid.body);
  res.json({ data: user });
}

async function deleteUser(req, res) {
  const { user, deleted } = await userService.deleteUser(req.user, req.valid.params.id);
  res.json({ data: { _id: user._id, deleted } });
}

async function groupedByInterests(req, res) {
  res.json(await userService.groupedByInterests(req.valid.query));
}

async function getUserPosts(req, res) {
  res.json(await userService.getUserPosts(req.valid.params.id, req.valid.query));
}

module.exports = {
  getMe,
  updateMe,
  listUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  groupedByInterests,
  getUserPosts,
};
