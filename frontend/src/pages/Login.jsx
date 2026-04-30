import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../api/authService';
import { showError, showSuccess } from '../utils/toast';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      showSuccess(location.state.message);
    }
  }, [location.state]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await authService.login(email, password);
      showSuccess('Login berhasil.');
      const redirectTo = location.state?.redirect || '/home';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err.message || 'Login failed. Please check your credentials.';
      setError(message);
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-3xl border border-blue-800 bg-blue-900/90 p-8 shadow-xl shadow-black/20">
      <h1 className="text-3xl font-bold text-white">Login</h1>
      <p className="mt-2 text-blue-400">Access your TripMate dashboard and continue planning your next adventure.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <div className="rounded-2xl border border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <label className="block space-y-2 text-sm text-blue-300">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-2xl border border-blue-700 bg-blue-950/80 px-4 py-3 text-blue-100 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
          />
        </label>

        <label className="block space-y-2 text-sm text-blue-300">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="w-full rounded-2xl border border-blue-700 bg-blue-950/80 px-4 py-3 text-blue-100 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-teal-400 px-5 py-3 text-sm font-semibold text-blue-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-blue-400">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-teal-300 hover:text-teal-200">
          Register
        </Link>
      </p>
    </section>
  );
}
