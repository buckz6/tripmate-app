import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(password) {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const lengthScore = Math.min(password.length / 2, 4);
  const score = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length + lengthScore;

  if (score >= 6) return { label: 'Kuat', color: 'bg-emerald-400', value: 100 };
  if (score >= 4) return { label: 'Sedang', color: 'bg-amber-400', value: 70 };
  if (score >= 2) return { label: 'Lemah', color: 'bg-rose-500', value: 40 };
  return { label: 'Sangat lemah', color: 'bg-rose-600', value: 20 };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [redirectTimer, setRedirectTimer] = useState(null);

  useEffect(() => {
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [redirectTimer]);

  const passwordStrength = getPasswordStrength(password);
  const passwordRequirements = password.length >= 8 && /[A-Z]/.test(password);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Semua bidang wajib diisi.');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Alamat email tidak valid.');
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password)) {
      setError('Password minimal 8 karakter dan harus memiliki huruf besar.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi tidak cocok.');
      return;
    }
    if (!acceptedTerms) {
      setError('Anda harus menyetujui syarat dan ketentuan.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/auth/register', {
        name: fullName,
        email,
        password,
      });
      setSuccess('Akun berhasil dibuat. Mengalihkan ke login...');
      const timer = setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { message: 'Akun berhasil dibuat. Silakan masuk.' },
        });
      }, 2000);
      setRedirectTimer(timer);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Pendaftaran gagal. Silakan coba lagi.';
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
                Buat perjalananmu lebih mudah dengan fitur perencanaan pintar, pencatatan memori, dan komunitas petualang.
              </p>
            </div>

            <div className="space-y-4 py-8">
              <FeatureCard
                icon="🛫"
                title="Perencanaan Cerdas"
                description="Susun itinerary adaptif untuk setiap gaya perjalanan dalam hitungan menit."
              />
              <FeatureCard
                icon="📌"
                title="Temukan Destinasi"
                description="Jelajahi rekomendasi lokal dan tempat favorit di seluruh dunia."
              />
              <FeatureCard
                icon="💬"
                title="Bagikan Cerita"
                description="Simpan pengalamanmu dan ceritakan kembali momen perjalanan terbaik."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-gray-50 px-6 py-12 sm:px-8">
          <div className="w-full max-w-md rounded-xl bg-white p-10 shadow-md border border-gray-300 sm:p-12">
            <div className="mb-8 space-y-3 text-center">
              <p className="text-sm uppercase tracking-[0.4em] text-teal-600 font-semibold">Mulai perjalananmu</p>
              <h2 className="text-3xl font-bold text-slate-900">Buat akun TripMate</h2>
              <p className="text-sm text-slate-700">
                Daftar sekarang untuk mulai merencanakan perjalanan dan menyimpan memori hebat.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-semibold">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <label className="block text-sm font-medium text-slate-900">
                Nama Lengkap
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Budi Santoso"
                  required
                  className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-teal-500"
                />
              </label>

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
                    placeholder="Buat password"
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

              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Kekuatan password</span>
                  <span className="font-semibold text-slate-900">{passwordStrength.label}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-300">
                  <div className={`${passwordStrength.color} h-full`} style={{ width: `${passwordStrength.value}%` }} />
                </div>
                <p className="text-xs text-slate-600">
                  Minimal 8 karakter dan harus memiliki huruf besar.
                </p>
              </div>

              <label className="block text-sm font-medium text-slate-900">
                Konfirmasi Password
                <div className="mt-3 relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-28 text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-slate-700 transition hover:bg-gray-200"
                  >
                    {showConfirm ? 'Sembunyikan' : 'Tampilkan'}
                  </button>
                </div>
              </label>

              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded-lg border border-gray-300 bg-white text-teal-600 focus:ring-teal-500"
                />
                <span>
                  Saya menyetujui <span className="font-semibold text-slate-900">syarat dan ketentuan</span> TripMate.
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-teal-700 transition disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    Mendaftarkan...
                  </>
                ) : (
                  'Buat Akun'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-700">
              Sudah punya akun?{' '}
              <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700">
                Masuk sekarang
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
