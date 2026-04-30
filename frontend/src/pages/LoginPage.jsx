import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const token = response?.data?.token || response?.data?.accessToken;
      const user = response?.data?.user || response?.data;

      if (!token) {
        throw new Error('Token not returned from server.');
      }

      localStorage.setItem('tripmate_token', token);
      localStorage.setItem('tripmate_user', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('tripmate_user:update'));
      navigate('/home', { replace: true });
    } catch (err) {
      const message = err?.message || 'Unable to login. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-700 px-8 py-12 text-white sm:px-16 lg:px-20">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_32%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <div className="mb-10 inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20 backdrop-blur-sm ring-1 ring-white/10">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-2xl">✈️</span>
                <span>TripMate</span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Rencanakan. Pesan. Ceritakan.
              </h1>
              <p className="mt-6 max-w-xl text-base text-slate-100/90 sm:text-lg">
                Mulai perjalananmu dengan rencana cerdas, pengalaman terorganisir, dan cerita yang tak terlupakan.
              </p>
            </div>

            <div className="space-y-4 py-8">
              <FeatureCard
                icon="🧭"
                title="Rencana Perjalanan"
                description="Buat itinerary personal dalam hitungan menit dan fokus pada petualanganmu."
              />
              <FeatureCard
                icon="📍"
                title="Temukan Destinasi"
                description="Jelajahi rekomendasi lokal dan pengalaman terbaik untuk setiap tujuan."
              />
              <FeatureCard
                icon="📝"
                title="Catat Kenangan"
                description="Simpan jurnal perjalananmu dengan mudah dan bawa kembali setiap momen."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-gray-50 px-6 py-12 sm:px-8">
          <div className="w-full max-w-md rounded-xl bg-white p-10 shadow-md border border-gray-300 sm:p-12">
            <div className="mb-8 space-y-3 text-center">
              <p className="text-sm uppercase tracking-[0.4em] text-teal-600 font-semibold">Selamat datang kembali</p>
              <h2 className="text-3xl font-bold text-slate-900">Masuk ke akun TripMate</h2>
              <p className="text-sm text-slate-700">
                Masukkan email dan password Anda untuk melanjutkan perencanaan perjalanan.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <label className="block text-sm font-medium text-slate-900">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-teal-500"
                />
              </label>

              <label className="block text-sm font-medium text-slate-900">
                Password
                <div className="mt-3 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-28 text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-slate-700 transition hover:bg-gray-200"
                  >
                    {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-teal-700 transition disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    Memproses...
                  </>
                ) : (
                  'Masuk Sekarang'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-700">
              Belum punya akun?{' '}
              <Link to="/register" className="font-semibold text-teal-600 hover:text-teal-700">
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl shadow-black/10 backdrop-blur-xl">
      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white/10 text-2xl">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-100/85">{description}</p>
    </div>
  );
}
