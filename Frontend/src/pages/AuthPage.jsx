import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, User, Hash, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const { login, register, isAuthenticated, booting, user, redirectPathForRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;
  const mode = location.pathname === '/register' ? 'register' : 'login';
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!booting && isAuthenticated && user) {
    return <Navigate to={redirectPathForRole(user.role)} replace />;
  }

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(loginEmail.trim(), loginPassword);
      navigate(from || data.redirectTo || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });
      setSuccess('Account created successfully! Please sign in.');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center px-6 pt-24 pb-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-[-10%] w-[50%] h-[50%] bg-accent-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-[-10%] w-[45%] h-[45%] bg-accent-purple/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md apple-card p-8 md:p-10 border border-border-gray/20 shadow-2xl shadow-black/5"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-accent-primary rounded-[12px] flex items-center justify-center text-white font-bold shadow-lg">
              C
            </div>
            <span className="font-semibold text-xl text-primary-text">CampusHealth</span>
          </Link>
          <h1 className="text-2xl font-semibold text-primary-text tracking-tight mb-2">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-secondary-text text-sm">
            {mode === 'login'
              ? 'Sign in with your campus email to continue.'
              : 'Register as a student to access health services.'}
          </p>
        </div>

        <div className="flex p-1 bg-secondary-bg rounded-full mb-8">
          <button
            type="button"
            onClick={() => {
              setError('');
              setSuccess('');
              navigate('/login', { replace: true });
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${
              mode === 'login' ? 'bg-white text-primary-text shadow-sm' : 'text-secondary-text'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setError('');
              setSuccess('');
              navigate('/register', { replace: true });
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${
              mode === 'register' ? 'bg-white text-primary-text shadow-sm' : 'text-secondary-text'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="alert"
            className="mb-6 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3"
          >
            {success}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <label className="block">
              <span className="text-xs font-semibold text-secondary-text uppercase tracking-wide mb-2 block">
                Email
              </span>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text/70" />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border-gray/40 bg-white text-primary-text text-sm outline-none focus:ring-2 focus:ring-accent-primary/25 focus:border-accent-primary"
                  placeholder="you@university.edu"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-secondary-text uppercase tracking-wide mb-2 block">
                Password
              </span>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text/70" />
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border-gray/40 bg-white text-primary-text text-sm outline-none focus:ring-2 focus:ring-accent-primary/25 focus:border-accent-primary"
                  placeholder="••••••••"
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="apple-button-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign in <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-secondary-text uppercase tracking-wide mb-2 block">
                Full name
              </span>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text/70" />
                <input
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border-gray/40 bg-white text-primary-text text-sm outline-none focus:ring-2 focus:ring-accent-primary/25 focus:border-accent-primary"
                  placeholder="Jordan Lee"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-secondary-text uppercase tracking-wide mb-2 block">
                Email
              </span>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text/70" />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border-gray/40 bg-white text-primary-text text-sm outline-none focus:ring-2 focus:ring-accent-primary/25 focus:border-accent-primary"
                  placeholder="you@university.edu"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-secondary-text uppercase tracking-wide mb-2 block">
                Password
              </span>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text/70" />
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border-gray/40 bg-white text-primary-text text-sm outline-none focus:ring-2 focus:ring-accent-primary/25 focus:border-accent-primary"
                  placeholder="At least 6 characters"
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="apple-button-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Create account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-secondary-text mt-8">
          <Link to="/" className="text-accent-primary font-medium hover:underline">
            ← Back to home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
