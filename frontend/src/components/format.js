const PALETTE = ['#ff3d00', '#ff6b35', '#e8590c', '#f59f00', '#2f6bff', '#5b5bd6', '#0ca678', '#d6336c', '#7048e8', '#1c7ed6'];

export function colorFor(seed = '') {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function shortId(id = '') {
  return id.length > 8 ? `…${id.slice(-6)}` : id;
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

export function formatDate(value) {
  if (!value) return '';
  return dateFormat.format(new Date(value));
}

export function timeAgo(value) {
  if (!value) return '';
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return relative.format(Math.round(seconds / size), unit);
    }
  }
  return 'just now';
}

export function authorOf(post) {
  const author = post.author;
  if (author && typeof author === 'object') return { id: author._id, name: author.name || 'Unknown member' };
  return { id: author, name: 'Unknown member' };
}

export function plural(count, word) {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}
