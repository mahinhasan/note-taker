import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandMark from './BrandMark';
import Icon from './Icon';
import { Avatar, IconButton } from './ui';

const LINKS = [
  { to: '/notes', label: 'Notes', icon: 'notes' },
  { to: '/posts', label: 'Posts', icon: 'posts' },
  { to: '/profile', label: 'Profile', icon: 'user' },
];

export function Brand({ to = '/notes' }) {
  return (
    <Link to={to} className="brand">
      <BrandMark />
      <span className="brand__text">Care Guide</span>
    </Link>
  );
}

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const links = role === 'admin' ? [...LINKS, { to: '/admin', label: 'Admin', icon: 'shield' }] : LINKS;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Brand />
        <nav className="nav" aria-label="Main">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className="nav__link">
              <Icon name={link.icon} size={16} />
              <span className="nav__label">{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="user-menu">
          <div className="user-menu__meta">
            <span className="user-menu__name">{user.name}</span>
            <span className="user-menu__email">{user.email}</span>
          </div>
          <Avatar name={user.name} seed={user._id} />
          <IconButton icon="logout" label="Log out" onClick={handleLogout} />
        </div>
      </div>
    </header>
  );
}
