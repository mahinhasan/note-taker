import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useAction from '../hooks/useAction';
import BootScreen from '../components/BootScreen';
import ErrorMessage from '../components/ErrorMessage';
import Icon from '../components/Icon';
import { Brand } from '../components/Navbar';
import { CtaButton, Field } from '../components/ui';
import { parseInterests } from '../components/interests';

const FEATURES = [
  'Private notes that only you and your admins can read',
  'A shared feed to keep the whole team updated',
  'Interest groups to connect people with shared skills',
];

function LoginForm({ onDone }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { run, busy, error } = useAction();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { ok } = await run(() => login(email, password));
    if (ok) onDone();
  };

  return (
    <form className="form" onSubmit={handleSubmit} aria-label="Log in">
      <Field label="Email">
        {(id) => (
          <input
            id={id}
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            autoFocus
          />
        )}
      </Field>
      <Field label="Password">
        {(id) => (
          <input
            id={id}
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        )}
      </Field>
      <ErrorMessage error={error} />
      <CtaButton loading={busy}>{busy ? 'Logging in…' : 'Log in'}</CtaButton>
    </form>
  );
}

function RegisterForm({ onDone }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [interests, setInterests] = useState('');
  const { run, busy, error } = useAction();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { ok } = await run(() => register({ name, email, password, interests: parseInterests(interests) }));
    if (ok) onDone();
  };

  return (
    <form className="form" onSubmit={handleSubmit} aria-label="Create account">
      <Field label="Full name">
        {(id) => (
          <input
            id={id}
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            autoComplete="name"
            placeholder="Jane Cooper"
            autoFocus
          />
        )}
      </Field>
      <Field label="Email">
        {(id) => (
          <input
            id={id}
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        )}
      </Field>
      <Field label="Password" hint="At least 8 characters">
        {(id) => (
          <input
            id={id}
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        )}
      </Field>
      <Field label="Interests" hint="Optional, comma-separated">
        {(id) => (
          <input
            id={id}
            className="input"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="music, art, hiking"
          />
        )}
      </Field>
      <ErrorMessage error={error} />
      <CtaButton loading={busy} icon="plus">
        {busy ? 'Creating account…' : 'Create account'}
      </CtaButton>
    </form>
  );
}

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const from = location.state?.from?.pathname || '/notes';

  if (loading) return <BootScreen />;
  if (user) return <Navigate to={from} replace />;

  const goNext = () => navigate(from, { replace: true });
  const isLogin = mode === 'login';

  return (
    <div className="auth">
      <aside className="auth__aside">
        <span className="dots dots--tr" />
        <span className="dots dots--bl" />
        <span className="auth__ring" />
        <Brand to="/login" />
        <div className="auth__content">
          <p className="eyebrow">Work With Care Guide</p>
          <h2 className="auth__headline">
            Notes &amp; Team Updates for the <span>Care Guide</span> Workspace
          </h2>
          <p className="auth__lead">
            Keep personal notes private, share updates with the whole team and find colleagues who share your
            interests, all in one secure place.
          </p>
          <div className="auth__divider" />
          <ul className="auth__features">
            {FEATURES.map((feature) => (
              <li key={feature}>
                <Icon name="check" size={18} strokeWidth={2.5} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <p className="auth__foot">© {new Date().getFullYear()} Care Guide. All rights reserved.</p>
      </aside>

      <main className="auth__main">
        <div className="auth__panel">
          <div className="auth__mobile-brand">
            <Brand to="/login" />
          </div>
          <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p>{isLogin ? 'Log in to continue to your Care Guide workspace.' : 'Join the Care Guide workspace in under a minute.'}</p>

          <div className="tabs auth__switch" role="tablist" aria-label="Authentication">
            <button type="button" role="tab" className="tab" aria-selected={isLogin} onClick={() => setMode('login')}>
              Log in
            </button>
            <button type="button" role="tab" className="tab" aria-selected={!isLogin} onClick={() => setMode('register')}>
              Register
            </button>
          </div>

          {isLogin ? <LoginForm onDone={goNext} /> : <RegisterForm onDone={goNext} />}
        </div>
      </main>
    </div>
  );
}
