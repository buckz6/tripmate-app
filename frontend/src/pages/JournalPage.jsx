import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { showError, showSuccess } from '../utils/toast';
import SkeletonList from '../components/SkeletonList';

const placeholderImage = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';

export default function JournalPage() {
  const location = useLocation();
  const [journals, setJournals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.state?.message) {
      showSuccess(location.state.message);
    }
  }, [location.state]);

  useEffect(() => {
    let mounted = true;

    const fetchJournals = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/journals');
        if (mounted) {
          setJournals(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        if (mounted) {
          const message = 'Gagal memuat jurnal. Silakan muat ulang halaman.';
          setError(message);
          showError('Tidak dapat memuat jurnal. Silakan coba lagi.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchJournals();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredJournals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return journals;
    return journals.filter((journal) => {
      const title = journal.title?.toLowerCase() || '';
      const destination = journal.destination?.toLowerCase() || '';
      return title.includes(query) || destination.includes(query);
    });
  }, [journals, searchQuery]);

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Yakin ingin menghapus jurnal ini? Tindakan ini tidak bisa dibatalkan.');
    if (!confirmed) return;

    setError('');
    try {
      await api.delete(`/journals/${id}`);
      const response = await api.get('/journals');
      setJournals(Array.isArray(response.data) ? response.data : []);
      showSuccess('Jurnal berhasil dihapus.');
    } catch (err) {
      const message = 'Gagal menghapus jurnal. Silakan coba kembali.';
      setError(message);
      showError(message);
    }
  };

  const formatDate = (value) => {
    if (!value) return 'Tanggal tidak tersedia';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Tanggal tidak tersedia';
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">Jurnal</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">Jurnal Perjalanan Saya</h1>
          <p className="mt-2 text-slate-600">Kelola catatan perjalanan dan simpan memori favoritmu di satu tempat.</p>
        </div>
        <Link
          to="/journal/create"
          className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-teal-700 transition"
        >
          Tulis Jurnal Baru
        </Link>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md">
        <label className="block text-sm font-semibold text-slate-700 mb-3">Cari jurnal</label>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berdasarkan judul atau destinasi"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
        />
      </div>

      {loading ? (
        <SkeletonList />
      ) : filteredJournals.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-md border-2 border-dashed border-gray-300">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-teal-100 text-4xl text-teal-600">
            🧳
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Belum ada jurnal. Yuk mulai perjalananmu!</h2>
          <p className="mt-3 text-slate-600">Tulis jurnal pertama dan simpan kenangan petualanganmu sekarang.</p>
          <Link
            to="/journal/create"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-teal-700 transition"
          >
            Buat Jurnal Baru
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredJournals.map((journal) => (
            <div key={journal.id || journal.title} className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden">
              <div className="h-48 overflow-hidden bg-gray-200">
                <img
                  src={journal.photo_url || placeholderImage}
                  alt={journal.title || 'Journal cover'}
                  className="h-full w-full object-cover transition duration-500 hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-slate-900">{journal.title || 'Judul tidak tersedia'}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>📍</span>
                    <span>{journal.destination || 'Destinasi tidak tersedia'}</span>
                  </div>
                </div>
                <p className="text-sm leading-6 text-slate-600">{journal.description ? `${journal.description.slice(0, 120)}${journal.description.length > 120 ? '...' : ''}` : 'Tidak ada deskripsi tersedia.'}</p>
                <div className="mt-auto flex items-center justify-between text-sm text-slate-500">
                  <span>{formatDate(journal.date)}</span>
                  <span>{journal.destination || '—'}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    to={`/journal/${journal.id}`}
                    className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-teal-700 transition"
                  >
                    Lihat
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(journal.id)}
                    className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-red-700 transition"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
    </div>
  );
}
