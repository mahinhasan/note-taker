const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Note = require('../src/models/Note');
const Post = require('../src/models/Post');
const { buildGroupedByInterestsPipeline, buildUserPostsPipeline } = require('../src/services/user.service');

const LIMIT = 20;

function collectPlanNodes(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    node.forEach((child) => collectPlanNodes(child, out));
    return out;
  }
  if (typeof node.stage === 'string') {
    out.push(node.indexName ? `${node.stage}(${node.indexName})` : node.stage);
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'rejectedPlans') continue;
    collectPlanNodes(value, out);
  }
  return out;
}

function findWinningPlans(explain, out = []) {
  if (!explain || typeof explain !== 'object') return out;
  for (const [key, value] of Object.entries(explain)) {
    if (key === 'rejectedPlans') continue;
    if (key === 'winningPlan') {
      out.push(value.queryPlan || value);
    } else if (value && typeof value === 'object') {
      findWinningPlans(value, out);
    }
  }
  return out;
}

function findLookupStats(explain) {
  const stages = Array.isArray(explain.stages) ? explain.stages : [];
  return stages
    .filter((stage) => stage.$lookup)
    .map((stage) => ({
      collectionScans: stage.collectionScans,
      indexesUsed: stage.indexesUsed,
      totalDocsExamined: stage.totalDocsExamined,
      totalKeysExamined: stage.totalKeysExamined,
    }));
}

function executionTotals(explain) {
  const stats = explain.executionStats
    || (explain.stages && explain.stages[0] && explain.stages[0].$cursor && explain.stages[0].$cursor.executionStats);
  if (!stats) return '';
  return `keysExamined=${stats.totalKeysExamined} docsExamined=${stats.totalDocsExamined} returned=${stats.nReturned}`;
}

const results = [];

function report(label, explain, extraCheck) {
  const plans = findWinningPlans(explain);
  const stages = plans.flatMap((plan) => collectPlanNodes(plan));
  let collscan = stages.some((stage) => stage.startsWith('COLLSCAN'));
  let extra = '';

  if (extraCheck) {
    const check = extraCheck(explain);
    collscan = collscan || check.collscan;
    extra = check.text;
  }

  results.push({ label, collscan });
  console.log(`\n${collscan ? 'FAIL' : ' OK '}  ${label}`);
  console.log(`      winning plan: ${stages.join(' <- ') || '(none reported)'}`);
  const totals = executionTotals(explain);
  if (totals) console.log(`      ${totals}`);
  if (extra) console.log(`      ${extra}`);
}

function explainDelete(Model, filter) {
  return mongoose.connection.db.command({
    explain: { delete: Model.collection.name, deletes: [{ q: filter, limit: 0 }] },
    verbosity: 'executionStats',
  });
}

async function printIndexes() {
  console.log('Indexes present:');
  for (const Model of [User, Note, Post]) {
    const indexes = await Model.collection.indexes();
    const names = indexes.map((index) => `${index.name}${index.unique ? ' (unique)' : ''}`);
    console.log(`  ${Model.collection.name}: ${names.join(', ')}`);
  }
}

async function main() {
  await connectDB();
  await Promise.all([User.init(), Note.init(), Post.init()]);
  await printIndexes();

  const sampleUser = await User.findOne({}, { _id: 1, email: 1, interests: 1 }).sort({ _id: -1 }).lean();
  const userId = sampleUser ? sampleUser._id : new mongoose.Types.ObjectId();
  const email = sampleUser ? sampleUser.email : 'nobody@example.com';
  const interest = sampleUser && sampleUser.interests && sampleUser.interests[0] ? sampleUser.interests[0] : 'music';
  const cursor = new mongoose.Types.ObjectId();

  if (!sampleUser) {
    console.log('\nNo users found; explaining against placeholder values. Seed some data for realistic stats.');
  }

  report('Login / register duplicate check: User.findOne({ email })',
    await User.findOne({ email }).select('+passwordHash').explain('executionStats'));

  report('authenticate middleware: User.findById(sub)',
    await User.findById(userId).explain('executionStats'));

  report('GET /api/users (admin list, first page)',
    await User.find({}).sort({ _id: -1 }).limit(LIMIT + 1).explain('executionStats'));

  report('GET /api/users?after=<id> (admin list, next page)',
    await User.find({ _id: { $lt: cursor } }).sort({ _id: -1 }).limit(LIMIT + 1).explain('executionStats'));

  report('DELETE /api/users/:id last-admin guard: User.exists({ _id, role })',
    await User.findOne({ _id: userId, role: 'admin' }).explain('executionStats'));

  report('GET /api/notes (user: own notes)',
    await Note.find({ owner: userId, _id: { $lt: cursor } }).sort({ _id: -1 }).limit(LIMIT + 1).explain('executionStats'));

  report('GET /api/notes (admin: all notes)',
    await Note.find({ _id: { $lt: cursor } }).sort({ _id: -1 }).limit(LIMIT + 1).explain('executionStats'));

  report('GET /api/notes?owner=<id> (admin: one owner)',
    await Note.find({ owner: userId }).sort({ _id: -1 }).limit(LIMIT + 1).explain('executionStats'));

  report('GET|PATCH|DELETE /api/notes/:id (owner scoped)',
    await Note.findOne({ _id: cursor, owner: userId }).explain('executionStats'));

  report('GET /api/posts (all posts)',
    await Post.find({ _id: { $lt: cursor } }).sort({ _id: -1 }).limit(LIMIT + 1).explain('executionStats'));

  report('GET /api/posts?author=<id>',
    await Post.find({ author: userId }).sort({ _id: -1 }).limit(LIMIT + 1).explain('executionStats'));

  report('GET /api/posts author populate: User.find({ _id: { $in: authorIds } }, { name: 1 })',
    await User.find({ _id: { $in: [userId, cursor] } }, { name: 1 }).explain('executionStats'));

  report('GET|PATCH|DELETE /api/posts/:id',
    await Post.findById(cursor).explain('executionStats'));

  report('DELETE /api/users/:id cascade: Note.deleteMany({ owner })',
    await explainDelete(Note, { owner: userId }));

  report('DELETE /api/users/:id cascade: Post.deleteMany({ author })',
    await explainDelete(Post, { author: userId }));

  report('GET /api/users/grouped-by-interests (no filter)',
    await User.aggregate(buildGroupedByInterestsPipeline({ limit: LIMIT })).explain('executionStats'));

  report(`GET /api/users/grouped-by-interests?interest=${interest}`,
    await User.aggregate(buildGroupedByInterestsPipeline({ interest, limit: LIMIT })).explain('executionStats'));

  report('GET /api/users/grouped-by-interests?after=<name>',
    await User.aggregate(buildGroupedByInterestsPipeline({ after: interest, limit: LIMIT })).explain('executionStats'));

  report('GET /api/users/:id/posts (outer $match + $lookup)',
    await User.aggregate(buildUserPostsPipeline({ userId, after: cursor, limit: LIMIT })).explain('executionStats'),
    (explain) => {
      const lookups = findLookupStats(explain);
      const scans = lookups.reduce((sum, l) => sum + (l.collectionScans || 0), 0);
      const used = lookups.flatMap((l) => l.indexesUsed || []);
      return {
        collscan: scans > 0,
        text: `$lookup: collectionScans=${scans} indexesUsed=[${used.join(', ')}]`,
      };
    });

  report('GET /api/users/:id/posts ($lookup inner query equivalent)',
    await Post.find({ author: userId, _id: { $lt: cursor } }).sort({ _id: -1 }).limit(LIMIT + 1).explain('executionStats'));

  const failed = results.filter((r) => r.collscan);
  console.log(`\n${results.length - failed.length}/${results.length} queries avoid COLLSCAN.`);
  if (failed.length) {
    console.log('COLLSCAN detected in:');
    failed.forEach((r) => console.log(`  - ${r.label}`));
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
