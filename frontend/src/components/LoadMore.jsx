import { Button, EmptyState, Skeletons } from './ui';

export default function LoadMore({
  nextCursor,
  loading,
  error,
  count,
  onLoadMore,
  emptyText = 'Nothing here yet.',
  emptyHint,
  emptyIcon,
  skeletonHeight,
}) {
  if (loading && count === 0) return <Skeletons height={skeletonHeight} />;

  if (nextCursor || loading) {
    return (
      <div className="list-footer">
        <Button variant="secondary" onClick={onLoadMore} loading={loading} disabled={loading}>
          {loading ? 'Loading…' : error ? 'Retry' : 'Load more'}
        </Button>
      </div>
    );
  }

  if (error) return null;
  if (count === 0) {
    return (
      <EmptyState icon={emptyIcon} title={emptyText}>
        {emptyHint}
      </EmptyState>
    );
  }
  return <div className="list-footer list-footer--end">You're all caught up</div>;
}
