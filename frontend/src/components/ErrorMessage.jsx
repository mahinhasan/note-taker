import Icon from './Icon';

export default function ErrorMessage({ error }) {
  if (!error) return null;
  return (
    <div role="alert" className="alert alert--error">
      <Icon name="alert" size={16} />
      <span>{error}</span>
    </div>
  );
}
