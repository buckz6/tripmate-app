import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../api/authService';
import { showError, showSuccess } from '../utils/toast';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.register(formData.name, formData.email, formData.password);
      showSuccess('Account created successfully! Please log in.');
      navigate('/login', { state: { message: 'Account created successfully! Please log in.' } });
    } catch (err) {
      const message = err.message || 'Registration failed. Please try again.';
      setError(message);
      showError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-3xl border border-blue-800 bg-blue-900/90 p-8 shadow-xl shadow-black/20">
      <h1 className="text-3xl font-bold text-white">Register</h1>
      <p className="mt-2 text-blue-400">Create your TripMate account and save trips, journals, and plans.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <div className="rounded-2xl border border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <label className="block space-y-2 text-sm text-blue-300">
          <span>Full Name</span>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="John Doe"
            required
            className="w-full rounded-2xl border border-blue-700 bg-blue-950/80 px-4 py-3 text-blue-100 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
          />
        </label>

        <label className="block space-y-2 text-sm text-blue-300">
          <span>Email</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="you@example.com"
            required
            className="w-full rounded-2xl border border-blue-700 bg-blue-950/80 px-4 py-3 text-blue-100 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
          />
        </label>

        <label className="block space-y-2 text-sm text-blue-300">
          <span>Password</span>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Create a password"
            required
            minLength={6}
            className="w-full rounded-2xl border border-blue-700 bg-blue-950/80 px-4 py-3 text-blue-100 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
          />
        </label>

        <label className="block space-y-2 text-sm text-blue-300">
          <span>Confirm Password</span>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm your password"
            required
            className="w-full rounded-2xl border border-blue-700 bg-blue-950/80 px-4 py-3 text-blue-100 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-teal-400 px-5 py-3 text-sm font-semibold text-blue-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-blue-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-teal-300 hover:text-teal-200">
          Sign In
        </Link>
      </p>
    </section>
  );
}
