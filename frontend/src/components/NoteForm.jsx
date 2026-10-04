import { useState } from 'react';
import useAction from '../hooks/useAction';
import ErrorMessage from './ErrorMessage';
import { Button, Field } from './ui';

export default function NoteForm({ initial = { title: '', content: '' }, submitLabel = 'Create note', onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content || '');
  const { run, busy, error } = useAction();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { ok } = await run(() => onSubmit({ title, content }));
    if (ok && !onCancel) {
      setTitle('');
      setContent('');
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <Field label="Title">
        {(id) => (
          <input
            id={id}
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            placeholder="e.g. Medication schedule"
            autoFocus={Boolean(onCancel)}
          />
        )}
      </Field>
      <Field label="Content">
        {(id) => (
          <textarea
            id={id}
            className="textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={onCancel ? 4 : 5}
            maxLength={20000}
            placeholder="Write something worth remembering…"
          />
        )}
      </Field>
      <ErrorMessage error={error} />
      <div className="form-actions">
        <Button type="submit" variant="primary" loading={busy} disabled={busy} icon={onCancel ? 'check' : 'plus'}>
          {busy ? 'Saving…' : submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
