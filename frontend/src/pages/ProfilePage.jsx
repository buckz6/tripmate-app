import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import profileService from '../api/profileService';
import { showError, showLoading, showSuccess } from '../utils/toast';

const toastClasses = {
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
  error: 'border-rose-500/20 bg-rose-500/10 text-rose-100',
};

function strengthLabel(password) {
  if (!password) return { label: 'Belum diisi', score: 0, color: 'bg-slate-500' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 1) return { label: 'Lemah', score, color: 'bg-rose-500' };
  if (score <= 3) return { label: 'Sedang', score, color: 'bg-amber-400' };
  return { label: 'Kuat', score, color: 'bg-emerald-500' };
}

export default function ProfilePage() {
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('tripmate_user') : null;
  const initialUser = storedUser ? JSON.parse(storedUser) : { name: '', email: '' };

  const [user, setUser] = useState({
    name: initialUser.name || '',
    email: initialUser.email || '',
    created_at: initialUser.created_at || '',
  });
  const [stats, setStats] = useState({
    total_journals: 0,
    total_destinations: 0,
    total_photos: 0,
    member_since: initialUser.created_at || '',
  });
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const [profile, profileStats] = await Promise.all([
          profileService.get(),
          profileService.getStats(),
        ]);
        setUser((prev) => ({ ...prev, ...profile }));
        setStats(profileStats);
      } catch (err) {
        const message = err.response?.data?.error || 'Gagal memuat profil. Silakan coba lagi.';
        setFormMessage({ type: 'error', text: message });
        showError(message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setFormMessage({ type: '', text: '' });
    const loadingId = showLoading('Menyimpan profil...');

    try {
      const updated = await profileService.update({ name: user.name, email: user.email });
      const stored = { ...JSON.parse(localStorage.getItem('tripmate_user') || '{}'), ...updated };
      localStorage.setItem('tripmate_user', JSON.stringify(stored));
      window.dispatchEvent(new Event('tripmate_user:update'));
      setUser((prev) => ({ ...prev, ...updated }));
      showSuccess('Profil berhasil diperbarui.');
      setFormMessage({ type: 'success', text: 'Profil berhasil diperbarui.' });
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Gagal memperbarui profil.';
      setFormMessage({ type: 'error', text: message });
      showError(message);
    } finally {
      toast.dismiss(loadingId);
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async (event) => {
    event.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      const message = 'Semua field password harus diisi.';
      setFormMessage({ type: 'error', text: message });
      showError(message);
      return;
    }
    if (newPassword !== confirmPassword) {
      const message = 'Konfirmasi password baru tidak cocok.';
      setFormMessage({ type: 'error', text: message });
      showError(message);
      return;
    }
    setPasswordSaving(true);
    setFormMessage({ type: '', text: '' });
    const loadingId = showLoading('Menyimpan password...');

    try {
      await profileService.changePassword({ old_password: currentPassword, new_password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFormMessage({ type: 'success', text: 'Password berhasil diperbarui.' });
      showSuccess('Password berhasil diperbarui.');
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Gagal memperbarui password.';
      setFormMessage({ type: 'error', text: message });
      showError(message);
    } finally {
      toast.dismiss(loadingId);
      setPasswordSaving(false);
    }
  };

  const passwordStrength = strengthLabel(newPassword);
  const memberSince = useMemo(() => {
    const date = new Date(stats.member_since || user.created_at || '');
    if (!date || Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [stats.member_since, user.created_at]);

  return (
    <div className="mx-auto max-w-7xl px-4 space-y-6 pb-10">
      <div className="bg-white rounded-xl p-8 shadow-md">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-teal-600 text-4xl font-bold text-white shadow-lg shadow-teal-600/20">
              {user.name?.trim()?.charAt(0).toUpperCase() || 'T'}
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">Profil Saya</p>
              <h1 className="mt-3 text-4xl font-bold text-slate-900">{user.name || 'Traveler'}</h1>
              <p className="mt-2 text-slate-600">{user.email || 'Email belum tersedia'}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Member sejak" value={memberSince} />
            <StatCard label="Total jurnal" value={stats.total_journals ?? 0} />
            <StatCard label="Total destinasi" value={stats.total_destinations ?? 0} />
          </div>
        </div>
      </div>

      {formMessage.text && (
        <div className={`rounded-lg p-4 text-sm ${formMessage.type === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-red-300 bg-red-50 text-red-700'}`}>
          {formMessage.text}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6 bg-white rounded-xl p-8 shadow-md">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">Edit Profil</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Perbarui informasi akun</h2>
            <p className="mt-2 text-slate-600">Ubah nama dan alamat email yang akan tampil di TripMate.</p>
          </div>
          <form onSubmit={handleProfileSave} className="space-y-6">
            <label className="block">
              <span className="mb-3 block text-sm font-semibold text-slate-700">Nama Lengkap</span>
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUser((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
              />
            </label>
            <label className="block">
              <span className="mb-3 block text-sm font-semibold text-slate-700">Email</span>
              <input
                type="email"
                value={user.email}
                onChange={(e) => setUser((prev) => ({ ...prev, email: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
              />
            </label>
            <button
              type="submit"
              disabled={profileSaving}
              className="w-full rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-teal-700 disabled:opacity-70 disabled:cursor-not-allowed transition"
            >
              {profileSaving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </form>
        </section>

        <section className="space-y-6 bg-white rounded-xl p-8 shadow-md">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">Ubah Password</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Amankan akun Anda</h2>
            <p className="mt-2 text-slate-600">Gunakan password baru dengan kombinasi huruf besar dan angka.</p>
          </div>
          <form onSubmit={handlePasswordSave} className="space-y-6">
            <label className="block">
              <span className="mb-3 block text-sm font-semibold text-slate-700">Password Saat Ini</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
              />
            </label>
            <label className="block">
              <span className="mb-3 block text-sm font-semibold text-slate-700">Password Baru</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
              />
            </label>
            <div className="space-y-3 rounded-lg border border-gray-300 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Kekuatan password</span>
                <span className="text-xs font-semibold text-slate-600">{passwordStrength.label}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full ${passwordStrength.color}`}
                  style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                />
              </div>
            </div>
            <label className="block">
              <span className="mb-3 block text-sm font-semibold text-slate-700">Konfirmasi Password Baru</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
              />
            </label>
            <button
              type="submit"
              disabled={passwordSaving}
              className="w-full rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-teal-700 disabled:opacity-70 disabled:cursor-not-allowed transition"
            >
              {passwordSaving ? 'Menyimpan...' : 'Simpan Password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-600 font-semibold">{label}</p>
      <p className="mt-4 text-3xl font-bold text-teal-600">{value}</p>
    </div>
  );
}
