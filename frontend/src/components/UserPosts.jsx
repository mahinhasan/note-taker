import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { PAGE_SIZE } from '../hooks/usePaginated';
import ErrorMessage from './ErrorMessage';
import LoadMore from './LoadMore';
import { Avatar, CopyId, IconButton } from './ui';
import { formatDate, plural, timeAgo } from './format';

export default function UserPosts({ userId, onClose }) {
  const [user, setUser] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (after) => {
      const id = ++requestId.current;
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/users/${userId}/posts`, { limit: PAGE_SIZE, after });
        if (id !== requestId.current) return;
        setUser((prev) =>
          after && prev ? { ...res.user, posts: [...prev.posts, ...res.user.posts] } : res.user
        );
        setNextCursor(res.nextCursor ?? null);
      } catch (err) {
        if (id === requestId.current) setError(err.message);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    setUser(null);
    setNextCursor(null);
    fetchPage(undefined);
  }, [fetchPage]);

  const posts = user ? user.posts : [];

  return (
    <section className="card card--accent sticky" aria-label="Posts by user">
      <div className="card__header">
        <div className="post__author">
          <Avatar name={user ? user.name : '?'} seed={userId} />
          <div>
            <h2 className="card__title">{user ? user.name : 'Loading…'}</h2>
            <div className="card__subtitle row" style={{ gap: 6 }}>
              <CopyId id={userId} />
              {posts.length > 0 && <span>{plural(posts.length, 'post')}{nextCursor ? '+' : ''}</span>}
            </div>
          </div>
        </div>
        <IconButton icon="x" label="Close" onClick={onClose} />
      </div>
      <div className="card__body stack">
        <ErrorMessage error={error} />
        {posts.length > 0 && (
          <ul className="item-list">
            {posts.map((post) => (
              <li key={post._id} className="item" style={{ boxShadow: 'none' }}>
                <h3 className="item__title">{post.title}</h3>
                <p className="item__body">{post.body}</p>
                <div className="item__meta" title={formatDate(post.createdAt)}>
                  {timeAgo(post.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
        <LoadMore
          nextCursor={nextCursor}
          loading={loading}
          error={error}
          count={posts.length}
          onLoadMore={() => fetchPage(nextCursor)}
          emptyIcon="posts"
          emptyText="No posts yet"
          emptyHint="This member hasn't published anything."
          skeletonHeight={80}
        />
      </div>
    </section>
  );
}
