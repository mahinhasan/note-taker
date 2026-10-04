const Note = require('../models/Note');
const ApiError = require('../utils/ApiError');
const { paginateById } = require('../utils/pagination');

const isAdmin = (actor) => actor.role === 'admin';

function scopedFilter(actor, id) {
  return isAdmin(actor) ? { _id: id } : { _id: id, owner: actor._id };
}

function listNotes(actor, { limit, after, owner }) {
  let filter;
  if (isAdmin(actor)) {
    filter = owner ? { owner } : {};
  } else {
    if (owner && String(owner) !== String(actor._id)) {
      throw ApiError.forbidden('You can only list your own notes');
    }
    filter = { owner: actor._id };
  }
  return paginateById(Note, filter, { limit, after });
}

function createNote(actor, { title, content }) {
  return Note.create({ owner: actor._id, title, content });
}

async function getNote(actor, id) {
  const note = await Note.findOne(scopedFilter(actor, id));
  if (!note) throw ApiError.notFound('Note not found');
  return note;
}

async function updateNote(actor, id, { title, content }) {
  const changes = {};
  if (title !== undefined) changes.title = title;
  if (content !== undefined) changes.content = content;

  const note = await Note.findOneAndUpdate(scopedFilter(actor, id), { $set: changes }, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!note) throw ApiError.notFound('Note not found');
  return note;
}

async function deleteNote(actor, id) {
  const note = await Note.findOneAndDelete(scopedFilter(actor, id));
  if (!note) throw ApiError.notFound('Note not found');
  return note;
}

module.exports = { listNotes, createNote, getNote, updateNote, deleteNote };
