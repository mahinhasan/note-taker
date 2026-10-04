import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BootScreen from './BootScreen';
import Icon from './Icon';

export default function AdminRoute({ children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <BootScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role !== 'admin') {
    return (
      <main className="container">
        <div className="notice">
          <div className="empty__icon">
            <Icon name="lock" size={24} />
          </div>
          <h1>Admins only</h1>
          <p>This page is only available to admins. Ask an administrator if you need access.</p>
          <Link to="/notes" className="btn btn--primary">
            Back to notes
          </Link>
        </div>
      </main>
    );
  }
  return children ?? <Outlet />;
}
