import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePaginated from '../hooks/usePaginated';
import ErrorMessage from '../components/ErrorMessage';
import LoadMore from '../components/LoadMore';
import PostForm from '../components/PostForm';
import PostItem from '../components/PostItem';
import UserPosts from '../components/UserPosts';
import { Avatar, PageHeader } from '../components/ui';
import { authorOf } from '../components/format';

const NO_PARAMS = {};

export default function PostsPage() {
  const { user, role } = useAuth();
  const [viewingAuthor, setViewingAuthor] = useState(null);
  const { items, setItems, nextCursor, loading, error, loadMore, reset } = usePaginated('/posts', NO_PARAMS);

  const handleCreate = async (input) => {
    await api.post('/posts', input);
    reset();
  };

  const handleUpdated = (updated) => {
    setItems((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  };

  const handleDeleted = (id) => {
    setItems((prev) => prev.filter((p) => p._id !== id));
  };

  const toggleAuthor = (authorId) => {
    setViewingAuthor((current) => (current === authorId ? null : authorId));
  };

  return (
    <main className="container">
      <PageHeader eyebrow="Team Updates" title="Posts" description="A shared feed for the whole Care Guide team." />

      <div className={viewingAuthor ? 'layout-split layout-split--wide-aside' : ''}>
        <div className="stack">
          <section className="card card--accent">
            <div className="card__header">
              <div className="post__author">
                <Avatar name={user.name} seed={user._id} />
                <div>
                  <h2 className="card__title">Share an update</h2>
                  <p className="card__subtitle">Posting as {user.name}. Everyone can read posts.</p>
                </div>
              </div>
            </div>
            <div className="card__body">
              <PostForm onSubmit={handleCreate} />
            </div>
          </section>

          <div className="row row--between">
            <h2 className="section-title">Latest posts</h2>
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
              {items.map((post) => {
                const authorId = authorOf(post).id;
                const isMine = authorId === user._id;
                return (
                  <PostItem
                    key={post._id}
                    post={post}
                    isMine={isMine}
                    canModify={role === 'admin' || isMine}
                    isViewing={viewingAuthor === authorId}
                    onUpdated={handleUpdated}
                    onDeleted={handleDeleted}
                    onViewAuthor={toggleAuthor}
                  />
                );
              })}
            </ul>
          )}
          <LoadMore
            nextCursor={nextCursor}
            loading={loading}
            error={error}
            count={items.length}
            onLoadMore={loadMore}
            emptyIcon="posts"
            emptyText="No posts yet"
            emptyHint="Be the first to share something with the community."
            skeletonHeight={140}
          />
        </div>

        {viewingAuthor && <UserPosts key={viewingAuthor} userId={viewingAuthor} onClose={() => setViewingAuthor(null)} />}
      </div>
    </main>
  );
}
