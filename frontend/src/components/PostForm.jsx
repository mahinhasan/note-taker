import { useState } from 'react';
import useAction from '../hooks/useAction';
import ErrorMessage from './ErrorMessage';
import { Button, Field } from './ui';

export default function PostForm({ initial = { title: '', body: '' }, submitLabel = 'Publish', onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const { run, busy, error } = useAction();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { ok } = await run(() => onSubmit({ title, body }));
    if (ok && !onCancel) {
      setTitle('');
      setBody('');
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
            placeholder="Give your post a headline"
            autoFocus={Boolean(onCancel)}
          />
        )}
      </Field>
      <Field label="Body">
        {(id) => (
          <textarea
            id={id}
            className="textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            required
            maxLength={20000}
            placeholder="Share an update with everyone…"
          />
        )}
      </Field>
      <ErrorMessage error={error} />
      <div className="form-actions">
        <Button type="submit" variant="primary" loading={busy} disabled={busy} icon={onCancel ? 'check' : 'posts'}>
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
