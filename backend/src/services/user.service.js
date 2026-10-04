const User = require('../models/User');
const Note = require('../models/Note');
const Post = require('../models/Post');
const ApiError = require('../utils/ApiError');
const { hashPassword, comparePassword } = require('../utils/password');
const { paginateById, normalizeLimit, buildPage, toObjectId } = require('../utils/pagination');

const PUBLIC_POST_FIELDS = { _id: 1, author: 1, title: 1, body: 1, createdAt: 1, updatedAt: 1 };

function pick(source, keys) {
  return keys.reduce((acc, key) => {
    if (source[key] !== undefined) acc[key] = source[key];
    return acc;
  }, {});
}

function isSameUser(a, b) {
  return String(a) === String(b);
}

async function findUserOrFail(id) {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

async function updateMe(currentUser, input) {
  const changes = pick(input, ['name', 'email', 'interests']);

  if (input.password !== undefined) {
    const withHash = await User.findById(currentUser._id).select('+passwordHash');
    const valid = await comparePassword(input.currentPassword, withHash && withHash.passwordHash);
    if (!valid) throw ApiError.badRequest('Current password is incorrect');
    changes.passwordHash = await hashPassword(input.password);
  }

  currentUser.set(changes);
  await currentUser.save();
  return currentUser;
}

function listUsers({ limit, after }) {
  return paginateById(User, {}, { limit, after });
}

async function createUser(input) {
  const data = pick(input, ['name', 'email', 'role', 'interests']);
  data.passwordHash = await hashPassword(input.password);
  return User.create(data);
}

async function updateUser(actor, id, input) {
  if (isSameUser(actor._id, id) && input.role !== undefined && input.role !== 'admin') {
    throw ApiError.badRequest('You cannot remove your own admin role');
  }

  const user = await findUserOrFail(id);
  const changes = pick(input, ['name', 'email', 'role', 'interests']);
  if (input.password !== undefined) {
    changes.passwordHash = await hashPassword(input.password);
  }

  user.set(changes);
  await user.save();
  return user;
}

async function ensureAnotherAdminRemains(actor) {
  const actorIsStillAdmin = await User.exists({ _id: actor._id, role: 'admin' });
  if (!actorIsStillAdmin) {
    throw ApiError.conflict('Cannot delete the last remaining admin');
  }
}

async function deleteUser(actor, id) {
  if (isSameUser(actor._id, id)) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  const user = await findUserOrFail(id);
  if (user.role === 'admin') {
    await ensureAnotherAdminRemains(actor);
  }

  await User.deleteOne({ _id: user._id });
  const [notes, posts] = await Promise.all([
    Note.deleteMany({ owner: user._id }),
    Post.deleteMany({ author: user._id }),
  ]);

  return {
    user,
    deleted: { notes: notes.deletedCount, posts: posts.deletedCount },
  };
}

function buildGroupedByInterestsPipeline({ interest, after, limit }) {
  const interestCondition = interest ? { $eq: interest } : { $gte: '' };
  if (after) interestCondition.$gt = after;

  return [
    { $match: { interests: interestCondition } },
    { $unwind: '$interests' },
    { $match: { interests: interestCondition } },
    {
      $group: {
        _id: '$interests',
        count: { $sum: 1 },
        users: { $push: { _id: '$_id', name: '$name' } },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: limit + 1 },
    { $project: { _id: 0, interest: '$_id', count: 1, users: 1 } },
  ];
}

async function groupedByInterests({ interest, after, limit }) {
  const pageSize = normalizeLimit(limit);
  const groups = await User.aggregate(buildGroupedByInterestsPipeline({ interest, after, limit: pageSize }));
  return buildPage(groups, pageSize, (group) => group.interest);
}

function buildUserPostsPipeline({ userId, after, limit }) {
  const cursorMatch = after ? { _id: { $lt: toObjectId(after) } } : {};

  return [
    { $match: { _id: toObjectId(userId) } },
    {
      $lookup: {
        from: Post.collection.name,
        localField: '_id',
        foreignField: 'author',
        pipeline: [
          { $match: cursorMatch },
          { $sort: { _id: -1 } },
          { $limit: limit + 1 },
          { $project: PUBLIC_POST_FIELDS },
        ],
        as: 'posts',
      },
    },
    { $project: { _id: 1, name: 1, posts: 1 } },
  ];
}

async function getUserPosts(userId, { after, limit }) {
  const pageSize = normalizeLimit(limit);
  const [result] = await User.aggregate(buildUserPostsPipeline({ userId, after, limit: pageSize }));
  if (!result) throw ApiError.notFound('User not found');

  const { data, nextCursor } = buildPage(result.posts, pageSize);
  return { user: { _id: result._id, name: result.name, posts: data }, nextCursor };
}

module.exports = {
  findUserOrFail,
  updateMe,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  groupedByInterests,
  getUserPosts,
  buildGroupedByInterestsPipeline,
  buildUserPostsPipeline,
};
