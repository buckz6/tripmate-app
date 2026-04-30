import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const categories = ['All', 'Pantai', 'Gunung', 'Budaya', 'Kuliner', 'Kota'];

const destinations = [
  {
    name: 'Bali',
    location: 'Bali',
    category: 'Pantai',
    rating: 4.9,
    description: 'Pulau Dewata dengan pantai eksotis dan budaya yang kaya.',
    gradient: 'from-teal-500 via-cyan-500 to-sky-500',
  },
  {
    name: 'Raja Ampat',
    location: 'Papua Barat',
    category: 'Pantai',
    rating: 4.9,
    description: 'Surga bawah laut dengan keanekaragaman terumbu karang yang menakjubkan.',
    gradient: 'from-fuchsia-500 via-pink-500 to-orange-400',
  },
  {
    name: 'Labuan Bajo',
    location: 'Nusa Tenggara Timur',
    category: 'Budaya',
    rating: 4.8,
    description: 'Gerbang menuju Komodo dan pulau-pulau cantik di sekitarnya.',
    gradient: 'from-emerald-500 via-lime-400 to-yellow-300',
  },
  {
    name: 'Yogyakarta',
    location: 'DI Yogyakarta',
    category: 'Budaya',
    rating: 4.8,
    description: 'Kota pelajar penuh sejarah, candi, dan kuliner legendaris.',
    gradient: 'from-indigo-500 via-violet-500 to-fuchsia-500',
  },
  {
    name: 'Lombok',
    location: 'Nusa Tenggara Barat',
    category: 'Gunung',
    rating: 4.7,
    description: 'Gunung Rinjani dan pantai cantik di sekitar selatannya.',
    gradient: 'from-rose-500 via-orange-400 to-amber-300',
  },
  {
    name: 'Danau Toba',
    location: 'Sumatera Utara',
    category: 'Kota',
    rating: 4.7,
    description: 'Danau vulkanik terbesar di dunia dengan budaya Batak yang kuat.',
    gradient: 'from-sky-500 via-cyan-400 to-emerald-500',
  },
  {
    name: 'Bromo',
    location: 'Jawa Timur',
    category: 'Gunung',
    rating: 4.8,
    description: 'Lanskap gunung berapi ikonik dengan matahari pagi yang memukau.',
    gradient: 'from-amber-400 via-orange-400 to-rose-500',
  },
  {
    name: 'Komodo',
    location: 'Nusa Tenggara Timur',
    category: 'Pantai',
    rating: 4.8,
    description: 'Rumah kadal raksasa dan pulau-pulau dengan alam liar memikat.',
    gradient: 'from-emerald-500 via-cyan-500 to-sky-500',
  },
  {
    name: 'Wakatobi',
    location: 'Sulawesi Tenggara',
    category: 'Pantai',
    rating: 4.9,
    description: 'Menyelam di taman nasional laut dengan terumbu karang luas.',
    gradient: 'from-cyan-500 via-sky-500 to-indigo-500',
  },
  {
    name: 'Bunaken',
    location: 'Sulawesi Utara',
    category: 'Pantai',
    rating: 4.8,
    description: 'Destinasi snorkeling terkenal dengan visibilitas air yang jernih.',
    gradient: 'from-teal-500 via-emerald-500 to-lime-400',
  },
  {
    name: 'Toraja',
    location: 'Sulawesi Selatan',
    category: 'Budaya',
    rating: 4.7,
    description: 'Tradisi unik dengan rumah adat tongkonan dan upacara adat.',
    gradient: 'from-violet-500 via-fuchsia-500 to-pink-500',
  },
  {
    name: 'Banda Neira',
    location: 'Maluku',
    category: 'Kuliner',
    rating: 4.8,
    description: 'Pulau rempah dengan sejarah budaya dan pemandangan laut tenang.',
    gradient: 'from-orange-500 via-amber-400 to-yellow-300',
  },
];

export default function ExplorePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const filteredDestinations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return destinations.filter((destination) => {
      const matchesCategory = activeCategory === 'All' || destination.category === activeCategory;
      const matchesQuery =
        !query ||
        destination.name.toLowerCase().includes(query) ||
        destination.location.toLowerCase().includes(query) ||
        destination.description.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();

    if (trimmed) {
      setSearchParams({ q: trimmed });
    } else {
      setSearchParams({});
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 space-y-6">
      <div className="bg-white rounded-xl p-8 shadow-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">Explore</p>
            <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">Cari destinasi terbaik di Indonesia</h1>
            <p className="text-slate-700">Filter berdasarkan kategori dan temukan tempat yang paling cocok untuk jurnal perjalananmu.</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl">
            <label htmlFor="search" className="sr-only">
              Cari destinasi
            </label>
            <div className="flex items-center gap-3">
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari destinasi..."
                className="w-full border border-gray-300 rounded-lg px-5 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
              />
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-teal-600 px-6 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-teal-700 transition"
              >
                Cari
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                activeCategory === category
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">Destinasi</p>
            <h2 className="text-3xl font-bold text-slate-900">Temukan tempat wisata favoritmu</h2>
          </div>
          <p className="text-sm text-slate-700 font-semibold">{filteredDestinations.length} hasil ditemukan</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredDestinations.map((destination) => (
            <article key={destination.name} className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-md hover:shadow-lg transition hover:-translate-y-1">
              <div className={`h-56 bg-gradient-to-br ${destination.gradient} p-6`}> 
                <div className="flex h-full flex-col justify-between">
                  <span className="inline-flex rounded-lg bg-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/95 backdrop-blur-sm">
                    {destination.category}
                  </span>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{destination.name}</h3>
                    <p className="mt-2 text-sm text-white/90">{destination.location}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="flex items-center gap-2 text-amber-400">
                  <span>★ ★ ★ ★ ★</span>
                  <span className="text-sm text-slate-600 font-semibold">{destination.rating}</span>
                </div>
                <p className="text-sm leading-6 text-slate-700">{destination.description}</p>
                <button
                  type="button"
                  onClick={() => navigate('/journal/create', { state: { prefill: { destination: destination.name } } })}
                  className="w-full rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-teal-700 transition"
                >
                  Buat Jurnal
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
