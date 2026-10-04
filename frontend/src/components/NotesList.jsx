import { useMemo, useState } from 'react';
import { api } from '../api/client';
import usePaginated from '../hooks/usePaginated';
import ErrorMessage from './ErrorMessage';
import FilterBar from './FilterBar';
import LoadMore from './LoadMore';
import NoteForm from './NoteForm';
import NoteItem from './NoteItem';

export default function NotesList({ allowCreate = true, showOwnerFilter = false }) {
  const [owner, setOwner] = useState('');
  const params = useMemo(() => (owner ? { owner } : {}), [owner]);
  const { items, setItems, nextCursor, loading, error, loadMore, reset } = usePaginated('/notes', params);

  const handleCreate = async (input) => {
    await api.post('/notes', input);
    reset();
  };

  const handleUpdated = (updated) => {
    setItems((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));
  };

  const handleDeleted = (id) => {
    setItems((prev) => prev.filter((n) => n._id !== id));
  };

  const list = (
    <div className="stack">
      {showOwnerFilter && (
        <FilterBar
          label="Owner id"
          placeholder="Filter by owner id"
          value={owner}
          onApply={setOwner}
          loading={loading}
          mono
        />
      )}
      <div className="row row--between">
        <h2 className="section-title">{showOwnerFilter ? (owner ? 'Filtered notes' : 'All notes') : 'My notes'}</h2>
        {items.length > 0 && (
          <span className="muted small">
            Showing {items.length}
            {nextCursor ? '+' : ''}
          </span>
        )}
      </div>
      <ErrorMessage error={error} />
      {items.length > 0 && (
        <ul className="item-list">
          {items.map((note) => (
            <NoteItem
              key={note._id}
              note={note}
              showOwner={showOwnerFilter}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </ul>
      )}
      <LoadMore
        nextCursor={nextCursor}
        loading={loading}
        error={error}
        count={items.length}
        onLoadMore={loadMore}
        emptyIcon="notes"
        emptyText={owner ? 'No notes for this owner' : 'No notes yet'}
        emptyHint={allowCreate && !owner ? 'Create your first note using the form.' : undefined}
      />
    </div>
  );

  if (!allowCreate) return list;

  return (
    <div className="layout-split">
      <aside className="card card--accent sticky">
        <div className="card__header">
          <div>
            <h2 className="card__title">New note</h2>
            <p className="card__subtitle">Private to you. Admins can view all notes.</p>
          </div>
        </div>
        <div className="card__body">
          <NoteForm onSubmit={handleCreate} />
        </div>
      </aside>
      <section>{list}</section>
    </div>
  );
}
