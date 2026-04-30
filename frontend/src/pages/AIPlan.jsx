import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';

// Fix Leaflet default icon paths broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:       require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

const SESSION_ICON_COLOR = { morning: '#f59e0b', afternoon: '#10b981', evening: '#6366f1' };

function coloredIcon(session) {
  const color = SESSION_ICON_COLOR[session] || '#14b8a6';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

// Auto-fit map bounds when markers change
function FitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (!coords.length) return;
    const bounds = L.latLngBounds(coords.map((c) => [c.lat, c.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [coords, map]);
  return null;
}

// ── Static data ───────────────────────────────────────────────────────────────
const PREFERENCES = [
  { id: 'kuliner',     label: 'Kuliner',         emoji: '🍜' },
  { id: 'alam',        label: 'Wisata Alam',      emoji: '🌿' },
  { id: 'budaya',      label: 'Budaya & Sejarah', emoji: '🏛️' },
  { id: 'belanja',     label: 'Belanja',           emoji: '🛍️' },
  { id: 'petualangan', label: 'Petualangan',       emoji: '🧗' },
  { id: 'relaksasi',   label: 'Relaksasi',         emoji: '🧘' },
];

const WEATHER_OPTIONS = [
  { value: '',       label: 'Pilih kondisi cuaca (opsional)' },
  { value: 'cerah',  label: '☀️ Cerah' },
  { value: 'berawan',label: '⛅ Berawan' },
  { value: 'hujan',  label: '🌧️ Hujan' },
  { value: 'panas',  label: '🌡️ Panas & Lembab' },
];

const SESSION_META = [
  { key: 'morning',   label: 'Pagi',  emoji: '🌅' },
  { key: 'afternoon', label: 'Siang', emoji: '☀️' },
  { key: 'evening',   label: 'Malam', emoji: '🌙' },
];

const TYPE_EMOJI = { wisata: '🏛️', kuliner: '🍽️', hotel: '🏨', belanja: '🛍️' };

// ── Sub-components ────────────────────────────────────────────────────────────
function PreferenceChip({ pref, checked, onChange }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition select-none
      ${checked ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
      <input type="checkbox" className="sr-only" checked={checked} onChange={() => onChange(pref.id)} />
      <span>{pref.emoji}</span>
      <span>{pref.label}</span>
    </label>
  );
}

function DayCard({ day, morning, afternoon, evening, places = [], tips, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`overflow-hidden rounded-3xl border cursor-pointer transition-all duration-200
        ${isActive ? 'border-teal-400 shadow-lg shadow-teal-100 ring-2 ring-teal-300' : 'border-slate-200 bg-white shadow-sm hover:shadow-md'}`}
    >
      <div className={`px-6 py-4 ${isActive ? 'bg-gradient-to-r from-teal-600 to-teal-500' : 'bg-gradient-to-r from-teal-500 to-teal-400'}`}>
        <span className="text-xs font-bold uppercase tracking-widest text-white/80">Hari</span>
        <p className="text-2xl font-bold text-white">{day}</p>
      </div>

      <div className="divide-y divide-slate-100 bg-white">
        {SESSION_META.map(({ key, label, emoji }) => {
          const text = key === 'morning' ? morning : key === 'afternoon' ? afternoon : evening;
          const sessionPlaces = places.filter((p) => p.session === key);
          return (
            <div key={key} className="flex gap-4 px-6 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-xl">{emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{text}</p>
                {sessionPlaces.map((p, i) => (
                  <span key={i} className="mt-2 mr-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {TYPE_EMOJI[p.type] || '📍'} {p.name}
                    {p.coords && <span className="text-teal-500">•</span>}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {tips && (
        <div className="border-t border-amber-100 bg-amber-50 px-6 py-3">
          <p className="text-xs text-amber-700"><span className="font-semibold">💡 Tips:</span> {tips}</p>
        </div>
      )}
    </div>
  );
}

function LoadingSpinner({ destination }) {
  const steps = ['Menganalisis destinasi...', 'Mencari tempat nyata...', 'Menyusun itinerary...', 'Geocoding lokasi...'];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % steps.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-200 border-t-teal-500" />
        <div className="absolute inset-3 flex items-center justify-center text-2xl">🤖</div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-800">AI sedang menyusun itinerary {destination}...</p>
        <p className="mt-2 text-sm text-teal-600 font-medium animate-pulse">{steps[step]}</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-2 w-2 animate-bounce rounded-full bg-teal-400" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AIPlan() {
  const navigate = useNavigate();

  const [destination, setDestination] = useState('');
  const [duration, setDuration]       = useState(3);
  const [preferences, setPreferences] = useState([]);
  const [weatherCond, setWeatherCond] = useState('');
  const [weatherTemp, setWeatherTemp] = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [itinerary, setItinerary]     = useState(null);
  const [planMeta, setPlanMeta]       = useState(null);
  const [activeDay, setActiveDay]     = useState(0);
  const [isFallback, setIsFallback]   = useState(false);

  const togglePreference = (id) =>
    setPreferences((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);

  // All geocoded coords across all days for map bounds
  const allCoords = itinerary
    ? itinerary.flatMap((d) => (d.places || []).map((p) => p.coords).filter(Boolean))
    : [];

  // Coords for active day only (highlighted on map)
  const activeDayCoords = itinerary?.[activeDay]?.places?.map((p) => p.coords).filter(Boolean) || [];

  const executeGenerate = async () => {
    if (!destination.trim()) return;
    setError('');
    setItinerary(null);
    setPlanMeta(null);
    setActiveDay(0);
    setLoading(true);

    try {
      const prefLabels = preferences.map((id) => PREFERENCES.find((p) => p.id === id)?.label ?? id);
      const weather = weatherCond ? { condition: weatherCond, temp: weatherTemp || '28' } : null;

      const { data } = await api.post('/ai/plan', {
        destination: destination.trim(),
        duration: Number(duration),
        preferences: prefLabels,
        weather,
      });

      setItinerary(data.itinerary || []);
      setPlanMeta({ destination: data.destination, duration: data.duration });
      setIsFallback(data.isFromFallback || false);
    } catch (err) {
      setError(err.message || 'Gagal membuat itinerary. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToJournal = () => {
    if (!itinerary || !planMeta) return;
    const description = itinerary
      .map((d) => `Hari ${d.day}:\nPagi: ${d.morning}\nSiang: ${d.afternoon}\nMalam: ${d.evening}`)
      .join('\n\n');
    navigate('/journal/create', { state: { prefill: { destination: planMeta.destination, description } } });
  };

  // Indonesia center fallback
  const mapCenter = activeDayCoords.length
    ? [activeDayCoords[0].lat, activeDayCoords[0].lng]
    : allCoords.length
    ? [allCoords[0].lat, allCoords[0].lng]
    : [-2.548926, 118.0148634];

  return (
    <div className="mx-auto max-w-5xl px-4 space-y-8">

      {/* ── Header ── */}
      <div className="bg-white rounded-xl border border-gray-300 p-8 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-teal-600 text-3xl shadow-md">🤖</div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Trip Planner</h1>
            <p className="mt-0.5 text-sm text-slate-600">Itinerary dengan tempat nyata + peta interaktif</p>
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      <form onSubmit={(e) => { e.preventDefault(); executeGenerate(); }}
        className="space-y-6 bg-white rounded-xl border border-gray-300 p-8 shadow-md">

        {/* Destination */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Destinasi</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">📍</span>
            <input
              type="text" value={destination} onChange={(e) => setDestination(e.target.value)}
              placeholder="Contoh: Bali, Yogyakarta, Raja Ampat..."
              required
              className="w-full border border-gray-300 rounded-lg py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Durasi
            <span className="ml-2 rounded-lg bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">{duration} Hari</span>
          </label>
          <input type="range" min={1} max={14} value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-2 cursor-pointer appearance-none rounded-full bg-gray-200 accent-teal-600"
          />
          <div className="flex justify-between text-xs text-slate-500"><span>1 Hari</span><span>7 Hari</span><span>14 Hari</span></div>
        </div>

        {/* Weather context */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Kondisi Cuaca <span className="font-normal text-slate-500">(opsional)</span></label>
            <select value={weatherCond} onChange={(e) => setWeatherCond(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition bg-white">
              {WEATHER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {weatherCond && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Suhu (°C)</label>
              <input type="number" min={15} max={45} value={weatherTemp}
                onChange={(e) => setWeatherTemp(e.target.value)}
                placeholder="28"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition"
              />
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Preferensi <span className="font-normal text-slate-500">(opsional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {PREFERENCES.map((pref) => (
              <PreferenceChip key={pref.id} pref={pref} checked={preferences.includes(pref.id)} onChange={togglePreference} />
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3">
            <span className="mt-0.5">⚠️</span>
            <p className="flex-1 text-sm text-red-700">{error}</p>
            <button type="button" onClick={executeGenerate} disabled={loading}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
              Coba lagi
            </button>
          </div>
        )}

        <button type="submit" disabled={loading || !destination.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-700 disabled:opacity-60 transition">
          {loading
            ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Membuat itinerary...</>
            : <><span>✨</span> Generate Itinerary</>}
        </button>
      </form>

      {/* ── Empty state ── */}
      {!loading && !itinerary && !error && (
        <div className="bg-gray-50 rounded-xl border border-gray-300 p-10 text-center shadow-md">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-teal-600 text-4xl text-white shadow-md">🗺️</div>
          <h2 className="text-xl font-semibold text-slate-900">Itinerary belum dibuat</h2>
          <p className="mt-2 text-sm text-slate-600">Isi destinasi lalu klik Generate — AI akan menyusun rencana dengan tempat nyata dan peta interaktif.</p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-300 shadow-md">
          <LoadingSpinner destination={destination} />
        </div>
      )}

      {/* ── Result ── */}
      {!loading && itinerary && planMeta && (
        <div className="space-y-6">

          {/* Result header */}
          <div className="flex flex-col gap-4 bg-white rounded-xl border border-gray-300 px-8 py-6 shadow-md sm:flex-row sm:items-center sm:justify-between">
            <div>
              {isFallback && (
                <span className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  ⚠️ Mode offline — data contoh
                </span>
              )}
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Itinerary untuk</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">{planMeta.destination}</h2>
              <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-600">
                <span>📅 {planMeta.duration} hari</span>
                {weatherCond && <span>🌤️ {weatherCond}{weatherTemp ? ` · ${weatherTemp}°C` : ''}</span>}
                <span>📍 {allCoords.length} lokasi dipetakan</span>
              </div>
            </div>
            <button onClick={executeGenerate} disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50 transition">
              🔄 Generate Ulang
            </button>
          </div>

          {/* Map + Day cards side by side on large screens */}
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Interactive map */}
            <div className="sticky top-20 h-fit">
              <div className="overflow-hidden rounded-2xl border border-gray-300 shadow-md">
                <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">🗺️ Peta Lokasi — Hari {activeDay + 1}</p>
                  <div className="flex gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" />Pagi</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />Siang</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-indigo-400" />Malam</span>
                  </div>
                </div>
                <div className="h-[420px]">
                  <MapContainer center={mapCenter} zoom={10} className="h-full w-full" scrollWheelZoom>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {activeDayCoords.length > 0 && <FitBounds coords={activeDayCoords} />}
                    {(itinerary[activeDay]?.places || []).map((place, i) =>
                      place.coords ? (
                        <Marker key={i} position={[place.coords.lat, place.coords.lng]} icon={coloredIcon(place.session)}>
                          <Popup>
                            <div className="text-sm">
                              <p className="font-semibold">{place.name}</p>
                              <p className="text-slate-500 capitalize">{TYPE_EMOJI[place.type]} {place.type} · {place.session}</p>
                            </div>
                          </Popup>
                        </Marker>
                      ) : null
                    )}
                  </MapContainer>
                </div>
                {/* Day selector tabs */}
                <div className="flex overflow-x-auto bg-slate-50 border-t border-gray-200">
                  {itinerary.map((_, i) => (
                    <button key={i} onClick={() => setActiveDay(i)}
                      className={`flex-shrink-0 px-4 py-2.5 text-xs font-semibold transition
                        ${activeDay === i ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                      Hari {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Places list for active day */}
              {(itinerary[activeDay]?.places || []).filter((p) => p.coords).length > 0 && (
                <div className="mt-4 rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Lokasi Hari {activeDay + 1}</p>
                  <div className="space-y-2">
                    {(itinerary[activeDay]?.places || []).map((p, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: SESSION_ICON_COLOR[p.session] || '#14b8a6' }} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                          <p className="text-xs text-slate-500 capitalize">{TYPE_EMOJI[p.type]} {p.type}</p>
                        </div>
                        {p.coords
                          ? <span className="ml-auto text-xs text-teal-600 font-medium">📍 dipetakan</span>
                          : <span className="ml-auto text-xs text-slate-400">tidak ditemukan</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Day cards */}
            <div className="space-y-4">
              {itinerary.map((day, i) => (
                <DayCard
                  key={day.day}
                  day={day.day}
                  morning={day.morning}
                  afternoon={day.afternoon}
                  evening={day.evening}
                  places={day.places || []}
                  tips={day.tips}
                  isActive={activeDay === i}
                  onClick={() => setActiveDay(i)}
                />
              ))}
            </div>
          </div>

          {/* Save to journal */}
          <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900">Suka dengan itinerary ini?</p>
                <p className="mt-1 text-sm text-slate-600">Simpan ke jurnal perjalananmu agar tidak hilang.</p>
              </div>
              <button onClick={handleSaveToJournal}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
                <span>📓</span> Simpan ke Jurnal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
