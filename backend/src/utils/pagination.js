const mongoose = require('mongoose');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function toObjectId(value) {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  return new mongoose.Types.ObjectId(String(value));
}

function normalizeLimit(limit) {
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function applyIdCursor(filter, after) {
  if (!after) return filter;
  return { ...filter, _id: { $lt: toObjectId(after) } };
}

function buildPage(docs, limit, cursorOf = (doc) => doc._id) {
  const hasMore = docs.length > limit;
  const data = hasMore ? docs.slice(0, limit) : docs;
  const nextCursor = hasMore ? String(cursorOf(data[data.length - 1])) : null;
  return { data, nextCursor };
}

async function paginateById(Model, filter, { limit, after, projection = { __v: 0 }, populate, lean = true } = {}) {
  const pageSize = normalizeLimit(limit);
  const query = Model.find(applyIdCursor(filter, after), projection)
    .sort({ _id: -1 })
    .limit(pageSize + 1);
  if (populate) query.populate(populate);
  const docs = await (lean ? query.lean() : query);
  return buildPage(docs, pageSize);
}

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  toObjectId,
  normalizeLimit,
  applyIdCursor,
  buildPage,
  paginateById,
};
