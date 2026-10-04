import { useState } from 'react';
import Icon from './Icon';
import { Button } from './ui';

export default function FilterBar({ label, placeholder, value, onApply, loading, normalize = (v) => v.trim(), mono = false }) {
  const [draft, setDraft] = useState(value);

  const submit = (event) => {
    event.preventDefault();
    onApply(normalize(draft));
  };

  const clear = () => {
    setDraft('');
    onApply('');
  };

  return (
    <form className="toolbar" onSubmit={submit} role="search">
      <div className="input-group">
        <span className="input-group__icon">
          <Icon name="search" size={15} />
        </span>
        <input
          className={mono ? 'input mono' : 'input'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
        />
      </div>
      <Button type="submit" variant="secondary" icon="filter" disabled={loading}>
        Filter
      </Button>
      {(value || draft) && (
        <Button variant="ghost" icon="x" onClick={clear} disabled={loading}>
          Clear
        </Button>
      )}
    </form>
  );
}
