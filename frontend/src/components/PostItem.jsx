import { useState } from 'react';
import { api } from '../api/client';
import useAction from '../hooks/useAction';
import ErrorMessage from './ErrorMessage';
import PostForm from './PostForm';
import { Avatar, Button, ConfirmButton, IconButton } from './ui';
import { authorOf, formatDate, timeAgo } from './format';

export default function PostItem({ post, isMine, canModify, isViewing, onUpdated, onDeleted, onViewAuthor }) {
  const [editing, setEditing] = useState(false);
  const { run, busy, error } = useAction();

  const handleSave = async (changes) => {
    const res = await api.patch(`/posts/${post._id}`, changes);
    onUpdated(res.data);
    setEditing(false);
  };

  const handleDelete = async () => {
    const { ok } = await run(() => api.del(`/posts/${post._id}`));
    if (ok) onDeleted(post._id);
  };

  if (editing) {
    return (
      <li className="item item--editing">
        <PostForm initial={post} submitLabel="Save changes" onSubmit={handleSave} onCancel={() => setEditing(false)} />
      </li>
    );
  }

  const author = authorOf(post);

  return (
    <li className="item">
      <div className="item__head">
        <div className="post__author">
          <Avatar name={author.name} seed={author.id} />
          <div>
            <div className="post__author-name">
              {author.name}
              {isMine && <span className="muted"> · you</span>}
            </div>
            <div className="post__author-sub" title={formatDate(post.createdAt)}>
              {timeAgo(post.createdAt)}
              {post.updatedAt !== post.createdAt && ' · edited'}
            </div>
          </div>
        </div>
        {canModify && (
          <div className="item__actions">
            <IconButton icon="edit" label="Edit post" onClick={() => setEditing(true)} disabled={busy} />
            <ConfirmButton label="Delete post" prompt="Delete this post?" busy={busy} onConfirm={handleDelete} />
          </div>
        )}
      </div>
      <div className="post__body">
        <h3 className="item__title">{post.title}</h3>
        <p className="item__body">{post.body}</p>
      </div>
      {onViewAuthor && (
        <div className="post__footer">
          <span className="muted small">{isMine ? 'Posted by you' : `Posted by ${author.name}`}</span>
          <Button
            variant={isViewing ? 'primary' : 'ghost'}
            size="sm"
            icon="user"
            onClick={() => onViewAuthor(author.id)}
            aria-pressed={isViewing}
          >
            View posts by this user
          </Button>
        </div>
      )}
      {error && (
        <div style={{ marginTop: 12 }}>
          <ErrorMessage error={error} />
        </div>
      )}
    </li>
  );
}
