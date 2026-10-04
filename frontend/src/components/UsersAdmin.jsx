import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePaginated from '../hooks/usePaginated';
import ErrorMessage from './ErrorMessage';
import Icon from './Icon';
import LoadMore from './LoadMore';
import UserForm from './UserForm';
import UserRow from './UserRow';

const NO_PARAMS = {};

export default function UsersAdmin() {
  const { user: me } = useAuth();
  const { items, setItems, nextCursor, loading, error, loadMore, reset } = usePaginated('/users', NO_PARAMS);

  const handleCreate = async (input) => {
    await api.post('/users', input);
    reset();
  };

  const handleUpdated = (updated) => {
    setItems((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
  };

  const handleDeleted = (id) => {
    setItems((prev) => prev.filter((u) => u._id !== id));
  };

  return (
    <div className="stack">
      <details className="card details-card">
        <summary className="card__header">
          <div>
            <h2 className="card__title">Add a user</h2>
            <p className="card__subtitle">Create an account with any role. They can sign in right away.</p>
          </div>
          <span className="btn btn--secondary btn--sm">
            <Icon name="plus" size={14} />
            New user
            <Icon name="chevronDown" size={14} className="chevron" />
          </span>
        </summary>
        <div className="card__body">
          <UserForm onSubmit={handleCreate} />
        </div>
      </details>

      <div className="card">
        <div className="card__header">
          <div>
            <h2 className="card__title">Users</h2>
            <p className="card__subtitle">Newest first. Deleting a user also removes their notes and posts.</p>
          </div>
          {items.length > 0 && (
            <span className="badge">
              {items.length}
              {nextCursor ? '+' : ''} loaded
            </span>
          )}
        </div>
        {error && (
          <div className="card__body">
            <ErrorMessage error={error} />
          </div>
        )}
        {items.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Interests</th>
                  <th>Id</th>
                  <th className="table__actions">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((user) => (
                  <UserRow
                    key={user._id}
                    user={user}
                    isSelf={me && me._id === user._id}
                    onUpdated={handleUpdated}
                    onDeleted={handleDeleted}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className={items.length ? 'card__footer' : 'card__body'}>
          <LoadMore
            nextCursor={nextCursor}
            loading={loading}
            error={error}
            count={items.length}
            onLoadMore={loadMore}
            emptyIcon="users"
            emptyText="No users found"
            skeletonHeight={56}
          />
        </div>
      </div>
    </div>
  );
}
