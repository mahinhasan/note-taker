import { Spinner } from './ui';

export default function BootScreen({ message = 'Restoring your session…' }) {
  return (
    <div className="boot">
      <div className="boot__inner">
        <Spinner large />
        <span>{message}</span>
      </div>
    </div>
  );
}
