import { useState } from 'react';
import { api } from '../api/client';
import useAction from '../hooks/useAction';
import ErrorMessage from './ErrorMessage';
import NoteForm from './NoteForm';
import { ConfirmButton, CopyId, IconButton } from './ui';
import { formatDate, timeAgo } from './format';

export default function NoteItem({ note, showOwner, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const { run, busy, error } = useAction();

  const handleSave = async (changes) => {
    const res = await api.patch(`/notes/${note._id}`, changes);
    onUpdated(res.data);
    setEditing(false);
  };

  const handleDelete = async () => {
    const { ok } = await run(() => api.del(`/notes/${note._id}`));
    if (ok) onDeleted(note._id);
  };

  if (editing) {
    return (
      <li className="item item--editing">
        <NoteForm initial={note} submitLabel="Save changes" onSubmit={handleSave} onCancel={() => setEditing(false)} />
      </li>
    );
  }

  const edited = note.updatedAt && note.updatedAt !== note.createdAt;

  return (
    <li className="item">
      <div className="item__head">
        <h3 className="item__title">{note.title}</h3>
        <div className="item__actions">
          <IconButton icon="edit" label="Edit note" onClick={() => setEditing(true)} disabled={busy} />
          <ConfirmButton label="Delete note" prompt="Delete this note?" busy={busy} onConfirm={handleDelete} />
        </div>
      </div>
      {note.content ? <p className="item__body">{note.content}</p> : <p className="item__body subtle">No content</p>}
      <div className="item__meta">
        <span title={formatDate(note.createdAt)}>Created {timeAgo(note.createdAt)}</span>
        {edited && (
          <span className="dot" title={formatDate(note.updatedAt)}>
            Edited {timeAgo(note.updatedAt)}
          </span>
        )}
        {showOwner && (
          <span className="dot row" style={{ gap: 6 }}>
            Owner <CopyId id={note.owner} />
          </span>
        )}
      </div>
      {error && (
        <div style={{ marginTop: 12 }}>
          <ErrorMessage error={error} />
        </div>
      )}
    </li>
  );
}
