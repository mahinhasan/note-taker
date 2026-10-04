import { useState } from 'react';
import useAction from '../hooks/useAction';
import ErrorMessage from './ErrorMessage';
import { Button, Field } from './ui';
import { formatInterests, parseInterests } from './interests';

const EMPTY = { name: '', email: '', role: 'user', interests: [] };

export default function UserForm({ initial = EMPTY, mode = 'create', onSubmit, onCancel }) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initial.role);
  const [interests, setInterests] = useState(formatInterests(initial.interests));
  const { run, busy, error } = useAction();
  const isCreate = mode === 'create';

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = { name, email, role, interests: parseInterests(interests) };
    if (password) payload.password = password;
    const { ok } = await run(() => onSubmit(payload));
    if (ok && isCreate) {
      setName('');
      setEmail('');
      setPassword('');
      setRole('user');
      setInterests('');
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <Field label="Full name">
          {(id) => (
            <input
              id={id}
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              placeholder="Jane Cooper"
              autoFocus={!isCreate}
            />
          )}
        </Field>
        <Field label="Email">
          {(id) => (
            <input
              id={id}
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="jane@example.com"
            />
          )}
        </Field>
        <Field label={isCreate ? 'Password' : 'New password'} hint={isCreate ? 'At least 8 characters' : 'Leave blank to keep current'}>
          {(id) => (
            <input
              id={id}
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={isCreate}
              minLength={8}
              autoComplete="new-password"
            />
          )}
        </Field>
        <Field label="Role">
          {(id) => (
            <select id={id} className="select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          )}
        </Field>
        <Field label="Interests" hint="Comma-separated">
          {(id) => (
            <input
              id={id}
              className="input"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="music, art"
            />
          )}
        </Field>
      </div>
      <ErrorMessage error={error} />
      <div className="form-actions">
        <Button type="submit" variant="primary" loading={busy} disabled={busy} icon={isCreate ? 'plus' : 'check'}>
          {busy ? 'Saving…' : isCreate ? 'Add user' : 'Save changes'}
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
