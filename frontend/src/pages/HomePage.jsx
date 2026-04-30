import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import LoadingPage from '../components/LoadingPage';
import SkeletonList from '../components/SkeletonList';

const destinationTiles = [
  { name: 'Bali', province: 'Bali', gradient: 'from-teal-500 via-cyan-500 to-sky-500' },
  { name: 'Raja Ampat', province: 'Papua Barat', gradient: 'from-fuchsia-500 via-pink-500 to-orange-400' },
  { name: 'Labuan Bajo', province: 'Nusa Tenggara Timur', gradient: 'from-emerald-500 via-lime-400 to-yellow-300' },
  { name: 'Yogyakarta', province: 'DI Yogyakarta', gradient: 'from-indigo-500 via-violet-500 to-fuchsia-500' },
  { name: 'Lombok', province: 'Nusa Tenggara Barat', gradient: 'from-rose-500 via-orange-400 to-amber-300' },
  { name: 'Danau Toba', province: 'Sumatera Utara', gradient: 'from-sky-500 via-cyan-400 to-emerald-500' },
];

const travelQuotes = [
  'Perjalanan terbaik dimulai dengan langkah pertama.',
  'Jelajahi dunia, kumpulkan cerita, dan pulang dengan kenangan.',
  'Awan hanya hambatan sementara dalam perjalananmu.',
  'Setiap destinasi baru adalah bab baru dalam hidupmu.',
  'Perjalanan mengubah kita menjadi versi terbaik diri kita.',
];

const dailyQuote = travelQuotes[new Date().getDate() % travelQuotes.length];
const currentDate = new Date().toLocaleDateString('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export default function HomePage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Traveler');
  const [journals, setJournals] = useState([]);
  const [stats, setStats] = useState({ totalJournals: 0, totalDestinations: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('tripmate_user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setUserName(parsed.name || 'Traveler');
      } catch {
        setUserName('Traveler');
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchPageData = async () => {
      setLoading(true);
      setError('');

      try {
        const [journalsRes, statsRes] = await Promise.all([
          api.get('/journals'),
          api.get('/profile/stats'),
        ]);

        if (!mounted) return;

        const journalsData = Array.isArray(journalsRes.data) ? journalsRes.data : [];
        setJournals(journalsData);

        const statsData = statsRes.data || {};
        setStats({
          totalJournals: statsData.totalJournals ?? journalsData.length,
          totalDestinations: statsData.totalDestinations ?? new Set(journalsData.map((item) => item.destination?.trim()?.toLowerCase()).filter(Boolean)).size,
        });
      } catch (err) {
        if (mounted) {
          setError('Tidak dapat memuat data dashboard. Silakan coba lagi.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPageData();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadCommunityLatest = async () => {
      setCommunityLoading(true);
      try {
        const response = await api.get('/community');
        if (!mounted) return;
        const data = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data.journals)
            ? response.data.journals
            : [];
        setCommunityPosts(data.slice(0, 3));
      } catch {
        if (mounted) setCommunityPosts([]);
      } finally {
        if (mounted) setCommunityLoading(false);
      }
    };

    loadCommunityLatest();
    return () => {
      mounted = false;
    };
  }, []);

  const recentJournals = useMemo(() => {
    return [...journals].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
  }, [journals]);

  const destinationsVisited = useMemo(() => {
    const unique = new Set(journals.map((item) => item.destination?.trim()?.toLowerCase()).filter(Boolean));
    return unique.size;
  }, [journals]);

  if (loading && !journals.length && !error) {
    return (
      <LoadingPage
        message="Memuat dashboard TripMate..."
        detail="Menyiapkan ringkasan perjalanan dan data terbaru untukmu."
      />
    );
  }

  return (
    <div className="space-y-8">
      <section className="hero-gradient rounded-[2rem] p-8 text-white shadow-2xl shadow-slate-900/20 ring-1 ring-white/10 md:p-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-100/90">Selamat datang di TripMate</p>
            <h1 className="text-4xl font-bold sm:text-5xl">Halo, {userName}!</h1>
            <p className="text-xl font-semibold text-white/90 sm:text-2xl">
              <span className="typing-text inline-block overflow-hidden border-r-4 border-teal-300 pr-2" style={{ whiteSpace: 'nowrap' }}>
                Rencanakan perjalanan impianmu dengan mudah.
              </span>
            </p>
            <p className="max-w-xl text-base text-white/80 sm:text-lg">Mau kemana hari ini? Temukan destinasi impian dan plan perjalananmu dalam sekejap.</p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-lg shadow-black/10 backdrop-blur-xl sm:p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-100">Cari destinasi</p>
            <form className="mt-4 flex items-center gap-3" onSubmit={(e) => {
              e.preventDefault();
              const query = searchQuery.trim();
              navigate(`/explore?q=${encodeURIComponent(query)}`);
            }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama kota atau tempat"
                className="w-full rounded-3xl border border-white/20 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-300/40"
              />
              <button type="submit" className="inline-flex h-12 items-center justify-center rounded-3xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800">
                Cari
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-gray-300 bg-white p-8 shadow-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">Cuaca & suasana</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900">{currentDate.charAt(0).toUpperCase() + currentDate.slice(1)}</h2>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-300 px-4 py-3 text-slate-700 shadow-sm">
              <p className="text-xs uppercase tracking-[0.35em] text-teal-600 font-semibold">Status</p>
              <p className="mt-2 text-3xl font-semibold">Cerah</p>
            </div>
          </div>
          <div className="mt-8 rounded-lg bg-gray-50 border border-gray-300 p-6 text-slate-700">
            <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">Quote perjalanan hari ini</p>
            <p className="mt-4 text-lg leading-relaxed text-slate-800">"{dailyQuote}"</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-300 bg-white p-8 shadow-md">
          <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">Destinasi Populer Indonesia</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {destinationTiles.map((destination) => (
              <button
                key={destination.name}
                type="button"
                onClick={() => navigate('/explore')}
                className={`group overflow-hidden rounded-xl p-5 text-left text-white shadow-md hover:shadow-lg transition hover:-translate-y-1 ${destination.gradient}`}
              >
                <div className="mb-6 h-36 rounded-lg bg-white/10" />
                <p className="text-xl font-semibold">{destination.name}</p>
                <p className="mt-2 text-sm text-white/80">{destination.province}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-4">
        <ActionCard title="Explore Destinasi" description="Jelajahi inspirasi perjalanan baru." route="/explore" icon="🗺️" />
        <ActionCard title="Pesan Perjalanan" description="Booking perjalanan dalam beberapa klik." route="/home" icon="🧳" />
        <ActionCard title="Tulis Jurnal" description="Simpan kenangan perjalananmu." route="/journal" icon="📝" />
        <ActionCard title="AI Trip Planner" description="Rencana perjalanan personal dengan AI." route="/ai-plan" icon="🤖" />
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 rounded-xl border border-gray-300 bg-white p-8 shadow-md md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">Jurnal Terbaru Komunitas</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">Cerita perjalanan terbaru</h2>
            <p className="mt-2 text-slate-700">Dapatkan inspirasi dari komunitas TripMate.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/community')}
            className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-teal-700 transition"
          >
            Lihat Semua
          </button>
        </div>

        {communityLoading ? (
          <SkeletonList />
        ) : communityPosts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-slate-700">
            <p className="text-4xl">🌍</p>
            <h3 className="mt-4 text-2xl font-semibold text-slate-900">Belum ada konten komunitas.</h3>
            <p className="mt-2 text-slate-600">Coba lagi nanti untuk melihat pembaruan terbaru.</p>
          </div>
        ) : (
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:snap-none md:overflow-visible">
            {communityPosts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => navigate('/community')}
                className="min-w-[280px] snap-start overflow-hidden rounded-xl border border-gray-300 bg-white p-6 text-left shadow-md hover:shadow-lg transition hover:-translate-y-1 md:min-w-0"
              >
                <div className="mb-4 h-44 rounded-lg bg-gray-200" />
                <p className="text-xs uppercase tracking-[0.35em] text-teal-600 font-semibold">{new Date(post.date || post.createdAt || post.created_at).toLocaleDateString('id-ID')}</p>
                <h3 className="mt-3 text-xl font-semibold text-slate-900">{post.title || post.destination || 'Jurnal Komunitas'}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">{post.description?.slice(0, 100) || 'Tidak ada deskripsi tersedia.'}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6 rounded-xl border border-gray-300 bg-white p-8 shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">Jurnal Terbaru</p>
            <h2 className="text-3xl font-semibold text-slate-900">Kenangan perjalanan terakhir</h2>
            <p className="mt-2 text-slate-700">Lihat catatan perjalanan terbaru yang sudah kamu simpan.</p>
          </div>
          <p className="text-sm text-slate-700">Menampilkan 3 jurnal terbaru dari total {journals.length || 0} entri.</p>
        </div>

        {loading ? (
          <SkeletonList />
        ) : error ? (
          <div className="rounded-lg border border-red-300 bg-red-50 p-6 text-sm text-red-700 font-semibold">{error}</div>
        ) : recentJournals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-slate-700">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 text-5xl text-teal-600">
              📓
            </div>
            <h2 className="text-3xl font-semibold text-slate-900">Belum ada jurnal perjalanan.</h2>
            <p className="mt-3 text-slate-600">Simpan setiap cerita perjalananmu dan jadikan TripMate sebagai buku jurnal digitalmu.</p>
            <button
              type="button"
              onClick={() => navigate('/journal/create')}
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-teal-700 transition"
            >
              Buat Jurnal Pertama
            </button>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {recentJournals.map((journal) => (
              <JournalCard key={journal.id || journal.title} journal={journal} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Jurnal" value={stats.totalJournals} />
        <StatCard label="Destinasi Dikunjungi" value={stats.totalDestinations} />
        <StatCard label="Pencarian" value={searchQuery ? 1 : 0} suffix={searchQuery ? 'aktif' : 'kosong'} />
        <StatCard label="Status Akun" value="Premium" />
      </section>
    </div>
  );
}

function ActionCard({ icon, title, description, route }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(route)}
      className="group block text-left rounded-xl border border-gray-300 bg-white p-6 shadow-md transition hover:shadow-lg hover:-translate-y-1"
    >
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-teal-600 text-2xl text-white shadow-md hover:shadow-lg transition group-hover:bg-teal-700">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 text-sm text-slate-700">{description}</p>
    </button>
  );
}

function JournalCard({ journal }) {
  const imageUrl = journal.photo || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
  const journalDate = journal.date ? new Date(journal.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanggal tidak tersedia';

  return (
    <article className="group overflow-hidden rounded-xl border border-gray-300 bg-white shadow-md transition hover:shadow-lg hover:-translate-y-1">
      <div className="h-52 overflow-hidden bg-gray-200">
        <img src={imageUrl} alt={journal.title || 'Journal photo'} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-teal-600 font-semibold">{journal.destination || 'Destinasi tidak diketahui'}</p>
        <h3 className="mt-3 text-xl font-semibold text-slate-900">{journal.title || 'Untitled Journal'}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-700">{journal.description || 'Ringkasan singkat perjalanan belum tersedia.'}</p>
        <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
          <span>{journalDate}</span>
          <span>{journal.destination ? journal.destination : '—'}</span>
        </div>
      </div>
    </article>
  );
}

function StatCard({ label, value, suffix }) {
  return (
    <div className="rounded-xl border border-gray-300 bg-white p-6 shadow-md">
      <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">{label}</p>
      <p className="mt-5 text-4xl font-semibold text-slate-900">{value} {suffix && <span className="text-base font-medium text-slate-700">{suffix}</span>}</p>
    </div>
  );
}
