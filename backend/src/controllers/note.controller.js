const noteService = require('../services/note.service');

async function listNotes(req, res) {
  res.json(await noteService.listNotes(req.user, req.valid.query));
}

async function createNote(req, res) {
  const note = await noteService.createNote(req.user, req.valid.body);
  res.status(201).json({ data: note });
}

async function getNote(req, res) {
  const note = await noteService.getNote(req.user, req.valid.params.id);
  res.json({ data: note });
}

async function updateNote(req, res) {
  const note = await noteService.updateNote(req.user, req.valid.params.id, req.valid.body);
  res.json({ data: note });
}

async function deleteNote(req, res) {
  await noteService.deleteNote(req.user, req.valid.params.id);
  res.status(204).end();
}

module.exports = { listNotes, createNote, getNote, updateNote, deleteNote };
