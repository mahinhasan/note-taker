import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import useAction from '../hooks/useAction';
import ErrorMessage from '../components/ErrorMessage';
import Icon from '../components/Icon';
import { Avatar, Button, Chips, CopyId, Field, PageHeader, RoleBadge } from '../components/ui';
import { formatInterests, parseInterests } from '../components/interests';
import { formatDate } from '../components/format';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [interests, setInterests] = useState(formatInterests(user.interests));
  const [saved, setSaved] = useState(false);
  const { run, busy, error } = useAction();

  const preview = parseInterests(interests);
  const dirty = name !== user.name || formatInterests(preview) !== formatInterests(user.interests);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaved(false);
    const { ok, result } = await run(() => api.patch('/users/me', { name, interests: preview }));
    if (ok) {
      setUser(result.data);
      setName(result.data.name);
      setInterests(formatInterests(result.data.interests));
      setSaved(true);
    }
  };

  return (
    <main className="container">
      <PageHeader eyebrow="Your Account" title="Profile" description="Manage how you appear to others and what you are interested in." />

      <div className="layout-split">
        <aside className="card card--accent sticky">
          <div className="card__body stack">
            <div className="profile-hero">
              <Avatar name={user.name} seed={user._id} size="lg" />
              <div style={{ minWidth: 0 }}>
                <h2>{user.name}</h2>
                <p className="muted">{user.email}</p>
              </div>
            </div>
            <dl className="dl">
              <dt>Role</dt>
              <dd>
                <RoleBadge role={user.role} />
              </dd>
              <dt>User id</dt>
              <dd>
                <CopyId id={user._id} />
              </dd>
              <dt>Member since</dt>
              <dd>{formatDate(user.createdAt)}</dd>
              <dt>Interests</dt>
              <dd>
                <Chips items={user.interests} empty={<span className="subtle">None yet</span>} />
              </dd>
            </dl>
          </div>
        </aside>

        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Edit profile</h2>
              <p className="card__subtitle">Changes are visible immediately.</p>
            </div>
          </div>
          <form className="card__body form" onSubmit={handleSubmit}>
            <Field label="Display name">
              {(id) => (
                <input
                  id={id}
                  className="input"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSaved(false);
                  }}
                  required
                  maxLength={100}
                />
              )}
            </Field>
            <Field label="Interests" hint="Separate with commas. Saved in lowercase, duplicates removed.">
              {(id) => (
                <input
                  id={id}
                  className="input"
                  value={interests}
                  onChange={(e) => {
                    setInterests(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="music, art, hiking"
                />
              )}
            </Field>
            {preview.length > 0 && (
              <div className="stack--sm" style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="field__label">Preview</span>
                <Chips items={preview} />
              </div>
            )}
            <ErrorMessage error={error} />
            {saved && (
              <div className="alert alert--success" role="status">
                <Icon name="check" size={16} />
                <span>Profile saved.</span>
              </div>
            )}
            <div className="form-actions">
              <Button type="submit" variant="primary" icon="check" loading={busy} disabled={busy || !dirty}>
                {busy ? 'Saving…' : 'Save profile'}
              </Button>
              {dirty && !busy && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setName(user.name);
                    setInterests(formatInterests(user.interests));
                  }}
                >
                  Discard changes
                </Button>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
