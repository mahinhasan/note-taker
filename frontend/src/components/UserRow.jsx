import { useState } from 'react';
import { api } from '../api/client';
import useAction from '../hooks/useAction';
import ErrorMessage from './ErrorMessage';
import UserForm from './UserForm';
import { Avatar, Chips, ConfirmButton, CopyId, IconButton, RoleBadge } from './ui';
import { formatDate, timeAgo } from './format';

export default function UserRow({ user, isSelf, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const { run, busy, error } = useAction();

  const handleSave = async (changes) => {
    const res = await api.patch(`/users/${user._id}`, changes);
    onUpdated(res.data);
    setEditing(false);
  };

  const handleDelete = async () => {
    const { ok } = await run(() => api.del(`/users/${user._id}`));
    if (ok) onDeleted(user._id);
  };

  if (editing) {
    return (
      <tr className="table__edit-row">
        <td colSpan={5}>
          <UserForm initial={user} mode="edit" onSubmit={handleSave} onCancel={() => setEditing(false)} />
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr>
        <td>
          <div className="user-cell">
            <Avatar name={user.name} seed={user._id} />
            <div style={{ minWidth: 0 }}>
              <div className="user-cell__name">
                {user.name}
                {isSelf && <span className="muted"> · you</span>}
              </div>
              <div className="user-cell__email">{user.email}</div>
            </div>
          </div>
        </td>
        <td>
          <RoleBadge role={user.role} />
        </td>
        <td>
          <Chips items={user.interests} empty={<span className="subtle">—</span>} />
        </td>
        <td>
          <div className="stack--sm" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <CopyId id={user._id} />
            <span className="subtle small" title={formatDate(user.createdAt)}>
              Joined {timeAgo(user.createdAt)}
            </span>
          </div>
        </td>
        <td className="table__actions">
          <IconButton icon="edit" label={`Edit ${user.name}`} onClick={() => setEditing(true)} disabled={busy} />
          <ConfirmButton
            label={`Delete ${user.name}`}
            prompt="Delete user and all their content?"
            busy={busy}
            onConfirm={handleDelete}
          />
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={5} style={{ paddingTop: 0 }}>
            <ErrorMessage error={error} />
          </td>
        </tr>
      )}
    </>
  );
}
