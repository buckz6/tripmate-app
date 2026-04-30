import { useState, useEffect, useCallback } from 'react';
import destinationService from '../api/destinationService';

export default function Explore() {
  const [destinations, setDestinations] = useState([]);
  const [query, setQuery]               = useState('');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [total, setTotal]               = useState(0);

  const fetchDestinations = useCallback(async (q = '') => {
    setLoading(true);
    setError('');
    try {
      const result = q.trim()
        ? await destinationService.search(q.trim())
        : await destinationService.getAll();
      setDestinations(result.destinations);
      setTotal(result.total);
    } catch (err) {
      setError(err.message || 'Gagal memuat destinasi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDestinations(); }, [fetchDestinations]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDestinations(query);
  };

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Explore</h1>
        <p className="mt-2 text-slate-500">Browse destinations and discover new adventures.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari destinasi..."
          className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
        />
        <button
          type="submit"
          className="rounded-2xl bg-teal-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-600"
        >
          Cari
        </button>
      </form>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-500" />
        </div>
      ) : destinations.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 py-16 text-center">
          <p className="text-lg font-semibold text-slate-500">
            {query ? `Tidak ada hasil untuk "${query}"` : 'Belum ada destinasi.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-400">{total} destinasi ditemukan</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {destinations.map((dest) => (
              <div
                key={dest.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="aspect-video overflow-hidden bg-slate-100">
                  {dest.image_url ? (
                    <img
                      src={dest.image_url}
                      alt={dest.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-slate-300">
                      🏝️
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-1">
                  <h3 className="font-semibold text-slate-900">{dest.name}</h3>
                  <p className="text-sm text-slate-500">📍 {dest.location}</p>
                  {dest.rating > 0 && (
                    <p className="text-sm text-amber-500">⭐ {dest.rating}</p>
                  )}
                  {dest.description && (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">{dest.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
