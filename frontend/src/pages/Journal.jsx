import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import journalService from '../api/journalService';
import MapView from '../components/MapView';

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

export default function Journal() {
  const navigate = useNavigate();
  const [journals, setJournals]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  useEffect(() => {
    journalService.getAll()
      .then(setJournals)
      .catch((err) => setError(err.message || 'Gagal memuat jurnal.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!window.confirm('Hapus jurnal ini?')) return;
    try {
      await journalService.remove(id);
      setJournals((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      alert(err.message || 'Gagal menghapus jurnal.');
    }
  };

  return (
    <section className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Travel Journal</h1>
          <p className="mt-2 text-slate-500">Capture memories from your trips.</p>
        </div>
        <button
          onClick={() => navigate('/journal/create')}
          className="rounded-2xl bg-teal-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-600"
        >
          + Add Journal
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-500" />
        </div>
      ) : journals.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 py-16 text-center">
          <p className="text-lg font-semibold text-slate-500">No journals yet</p>
          <p className="mt-1 text-sm text-slate-400">Start documenting your travel adventures!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {journals.map((journal) => (
            <div
              key={journal.id}
              onClick={() => navigate(`/journal/${journal.id}`)}
              className="group cursor-pointer rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-300 hover:shadow-md"
            >
              <div className="aspect-video mb-4 overflow-hidden rounded-2xl bg-slate-100">
                {journal.photo_url ? (
                  <img
                    src={journal.photo_url}
                    alt={journal.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl text-slate-300">
                    📷
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition">
                  {journal.title}
                </h3>
                <p className="text-sm text-slate-500">📍 {journal.destination}</p>
                <p className="text-xs text-slate-400">{formatDate(journal.date)}</p>
              </div>
              <button
                onClick={(e) => handleDelete(journal.id, e)}
                className="mt-4 text-xs text-red-400 hover:text-red-600 transition"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}

      <MapView />
    </section>
  );
}
