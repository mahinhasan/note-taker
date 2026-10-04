import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

export default function NotFoundPage() {
  return (
    <main className="container">
      <div className="notice">
        <div className="empty__icon">
          <Icon name="search" size={24} />
        </div>
        <h1>Page not found</h1>
        <p>The page you are looking for doesn’t exist or has been moved.</p>
        <Link to="/notes" className="btn btn--primary">
          <Icon name="arrowLeft" size={16} />
          Back to notes
        </Link>
      </div>
    </main>
  );
}
