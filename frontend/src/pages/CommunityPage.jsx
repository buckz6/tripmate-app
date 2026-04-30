import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import LoadingPage from '../components/LoadingPage';
import SkeletonList from '../components/SkeletonList';

const placeholderImage = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';
const sortOptions = ['Terbaru', 'Terpopuler'];

export default function CommunityPage() {
  const navigate = useNavigate();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDestination, setFilterDestination] = useState('Semua');
  const [sortOrder, setSortOrder] = useState('Terbaru');
  const [likes, setLikes] = useState({});
  const [likedIds, setLikedIds] = useState(() => new Set());

  const loadJournals = async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const response = query
        ? await api.get('/community/search', { params: { q: query } })
        : await api.get('/community');
      const list = Array.isArray(response.data.journals) ? response.data.journals : [];
      setJournals(list);
      const initialLikes = {};
      const initialLikedIds = new Set();
      list.forEach((item) => {
        initialLikes[item.id] = item.like_count ?? 0;
        if (item.is_liked) initialLikedIds.add(item.id);
      });
      setLikes(initialLikes);
      setLikedIds(initialLikedIds);
    } catch (err) {
      setError('Gagal memuat jurnal komunitas. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      loadJournals();
    }
    return () => {
      mounted = false;
    };
  }, []);

  const handleSearch = async () => {
    await loadJournals(searchQuery.trim());
  };

  const destinations = useMemo(() => {
    const set = new Set(journals.map((journal) => journal.destination?.trim()).filter(Boolean));
    return ['Semua', ...Array.from(set)];
  }, [journals]);

  const filteredJournals = useMemo(() => {
    return journals
      .filter((journal) => {
        if (filterDestination !== 'Semua' && journal.destination !== filterDestination) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'Terpopuler') {
          const aLikes = likes[a.id] ?? 0;
          const bLikes = likes[b.id] ?? 0;
          return bLikes - aLikes;
        }
        const aDate = new Date(a.date || a.createdAt || 0).getTime();
        const bDate = new Date(b.date || b.createdAt || 0).getTime();
        return bDate - aDate;
      });
  }, [journals, filterDestination, sortOrder, likes]);

  const handleLike = async (id) => {
    setError('');
    try {
      const response = await api.post(`/community/like/${id}`);
      const liked = response.data.liked;
      const likeCount = response.data.like_count ?? likes[id] ?? 0;

      setLikes((prevLikes) => ({ ...prevLikes, [id]: likeCount }));
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (liked) next.add(id);
        else next.delete(id);
        return next;
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengubah like. Silakan coba lagi.');
    }
  };

  const formatDate = (value) => {
    if (!value) return 'Tanggal tidak tersedia';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Tanggal tidak tersedia';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading && !journals.length && !error) {
    return (
      <LoadingPage
        message="Memuat jurnal komunitas..."
        detail="Menarik cerita terbaru dari penjelajah lain."
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 space-y-6">
      <header className="bg-white rounded-xl p-8 shadow-md">
        <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">Komunitas</p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900">Komunitas TripMate</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Temukan jurnal perjalanan publik dari komunitas, dapatkan inspirasi, dan temukan destinasi baru.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Cari jurnal</label>
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan judul atau destinasi"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
            <button
              type="button"
              onClick={handleSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              Cari
            </button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Filter destinasi</label>
            <select
              value={filterDestination}
              onChange={(e) => setFilterDestination(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
            >
              {destinations.map((destination) => (
                <option key={destination} value={destination}>{destination}</option>
              ))}
            </select>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Urutkan</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
            >
              {sortOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">Jurnal unggulan</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Cerita perjalanan dari penjelajah lain</h2>
          </div>
          <p className="text-sm text-slate-600 font-semibold">Menampilkan {filteredJournals.length} jurnal</p>
        </div>

        {loading ? (
          <SkeletonList />
        ) : filteredJournals.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center shadow-md">
            <p className="mb-4 text-4xl">🌍</p>
            <h3 className="text-2xl font-semibold text-slate-900">Belum ada jurnal komunitas.</h3>
            <p className="mt-2 text-slate-600">Coba gunakan kata kunci lain atau kembali nanti untuk melihat cerita baru.</p>
          </div>
        ) : (
          <div className="columns-1 gap-6 sm:columns-2 xl:columns-3">
            {filteredJournals.map((journal) => (
              <article
                key={journal.id}
                onClick={() => navigate(`/journal/${journal.id}`)}
                className="mb-6 break-inside-avoid cursor-pointer overflow-hidden rounded-xl border border-gray-300 bg-white shadow-md hover:shadow-lg transition hover:-translate-y-1"
              >
                <div className="h-56 overflow-hidden bg-gray-200">
                  <img
                    src={journal.photo_url || placeholderImage}
                    alt={journal.title || 'Journal cover'}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  />
                </div>
                <div className="space-y-4 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">{formatDate(journal.date || journal.created_at || journal.createdAt)}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(journal.id);
                      }}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${likedIds.has(journal.id) ? 'bg-teal-600 text-white' : 'bg-gray-100 text-slate-700 hover:bg-gray-200'}`}
                    >
                      ❤️
                      <span>{likes[journal.id] ?? 0}</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-900">{journal.title || 'Tanpa judul'}</h3>
                    <p className="text-sm text-teal-600 font-semibold">{journal.destination || 'Destinasi tidak diketahui'}</p>
                  </div>
                  <p className="text-sm leading-6 text-slate-700">{journal.description?.slice(0, 120) || 'Tidak ada deskripsi yang tersedia.'}</p>
                  <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm">
                    <p className="font-semibold text-slate-900">Penulis</p>
                    <p className="text-slate-700">{journal.author_name || (typeof journal.author === 'string' ? journal.author : journal.author?.name) || 'Traveler'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {error && <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    </div>
  );
}

function formatDate(value) {
  if (!value) return 'Tanggal tidak tersedia';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tanggal tidak tersedia';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
