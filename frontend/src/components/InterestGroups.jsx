import { useMemo, useState } from 'react';
import usePaginated from '../hooks/usePaginated';
import ErrorMessage from './ErrorMessage';
import FilterBar from './FilterBar';
import LoadMore from './LoadMore';
import { Avatar } from './ui';

export default function InterestGroups() {
  const [interest, setInterest] = useState('');
  const params = useMemo(() => (interest ? { interest } : {}), [interest]);
  const { items, nextCursor, loading, error, loadMore } = usePaginated('/users/grouped-by-interests', params);

  return (
    <div className="stack">
      <FilterBar
        label="Interest"
        placeholder="Filter by interest, e.g. music"
        value={interest}
        onApply={setInterest}
        loading={loading}
        normalize={(v) => v.trim().toLowerCase()}
      />
      <ErrorMessage error={error} />
      {items.length > 0 && (
        <div className="group-grid">
          {items.map((group) => (
            <article key={group.interest} className="card group-card">
              <div className="group-card__head">
                <h3 className="group-card__name">{group.interest}</h3>
                <span className="badge badge--count" title={`${group.count} members`}>
                  {group.count}
                </span>
              </div>
              <div className="member-list">
                {group.users.map((u) => (
                  <span key={u._id} className="member">
                    <Avatar name={u.name} seed={u._id} />
                    {u.name}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
      <LoadMore
        nextCursor={nextCursor}
        loading={loading}
        error={error}
        count={items.length}
        onLoadMore={loadMore}
        emptyIcon="tag"
        emptyText={interest ? `Nobody is interested in “${interest}” yet` : 'No interests recorded yet'}
        skeletonHeight={110}
      />
    </div>
  );
}
