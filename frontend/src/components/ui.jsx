import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon';
import { colorFor, initials, shortId } from './format';

export function Spinner({ large = false }) {
  return <span className={large ? 'spinner spinner--lg' : 'spinner'} role="status" aria-label="Loading" />;
}

export function Button({ variant = 'secondary', size, icon, loading = false, block = false, children, className = '', ...props }) {
  const classes = ['btn', `btn--${variant}`, size && `btn--${size}`, block && 'btn--block', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={classes} {...props}>
      {loading ? <Spinner /> : icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}

export function CtaButton({ loading = false, icon = 'arrowRight', children, ...props }) {
  return (
    <button type="submit" className="btn btn--primary btn--cta btn--block" disabled={loading} {...props}>
      <span>{children}</span>
      <span className="btn__bubble">{loading ? <Spinner /> : <Icon name={icon} size={18} strokeWidth={2.5} />}</span>
    </button>
  );
}

export function IconButton({ icon, label, variant = 'ghost', ...props }) {
  return (
    <button type="button" className={`btn btn--${variant} btn--sm btn--icon`} aria-label={label} title={label} {...props}>
      <Icon name={icon} size={15} />
    </button>
  );
}

export function Field({ label, hint, children }) {
  const id = useId();
  const child = typeof children === 'function' ? children(id) : children;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {child}
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions}
    </header>
  );
}

export function Avatar({ name, seed, size }) {
  const className = ['avatar', size && `avatar--${size}`].filter(Boolean).join(' ');
  return (
    <span className={className} style={{ background: colorFor(seed || name) }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function RoleBadge({ role }) {
  return (
    <span className={`badge badge--${role}`}>
      {role === 'admin' && <Icon name="shield" size={12} />}
      {role}
    </span>
  );
}

export function Chips({ items, empty = null }) {
  if (!items || !items.length) return empty;
  return (
    <div className="chips">
      {items.map((item) => (
        <span key={item} className="chip">
          {item}
        </span>
      ))}
    </div>
  );
}

export function EmptyState({ icon = 'inbox', title, children }) {
  return (
    <div className="empty">
      <div className="empty__icon">
        <Icon name={icon} size={22} />
      </div>
      <p className="empty__title">{title}</p>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Skeletons({ count = 3, height = 96 }) {
  return (
    <div className="stack" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}

export function CopyId({ id }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef();

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button type="button" className="copy-id" onClick={copy} title={`Copy ${id}`}>
      <Icon name={copied ? 'check' : 'copy'} size={12} />
      {copied ? 'Copied' : shortId(id)}
    </button>
  );
}

export function ConfirmButton({ label = 'Delete', prompt = 'Delete?', busy = false, onConfirm }) {
  const [asking, setAsking] = useState(false);

  if (busy) {
    return (
      <Button variant="danger-ghost" size="sm" loading disabled>
        Deleting…
      </Button>
    );
  }

  if (asking) {
    return (
      <span className="confirm" role="group" aria-label={prompt}>
        {prompt}
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            setAsking(false);
            onConfirm();
          }}
          autoFocus
        >
          Yes, delete
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setAsking(false)}>
          Cancel
        </Button>
      </span>
    );
  }

  return <IconButton icon="trash" label={label} variant="danger-ghost" onClick={() => setAsking(true)} />;
}
