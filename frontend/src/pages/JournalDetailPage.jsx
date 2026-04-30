import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';
import api from '../api/axios';
import 'leaflet/dist/leaflet.css';

const icon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [25, 41],
  shadowSize: [41, 41],
});

const placeholderImage = 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1200&q=80';
const indonesiaCenter = [-2.548926, 118.0148634];

export default function JournalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchJournal = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/journals/${id}`);
        if (!mounted) return;
        setJournal(response.data || null);
      } catch (err) {
        if (!mounted) return;
        if (err.response?.status === 404) {
          setError('Jurnal tidak ditemukan.');
        } else {
          setError('Gagal memuat jurnal. Silakan coba lagi.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchJournal();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link berhasil disalin!');
        setCopyStatus('URL berhasil disalin.');
        return;
      } catch {
        // fallback below
      }
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success('Link berhasil disalin!');
      setCopyStatus('URL berhasil disalin.');
    } catch {
      toast.error('Gagal menyalin link.');
      setCopyStatus('Gagal menyalin URL.');
    }
  };

  const formatDate = (value) => {
    if (!value) return 'Tanggal tidak tersedia';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Tanggal tidak tersedia';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-6 shadow-2xl shadow-black/20">
          <div className="h-72 rounded-[2rem] bg-slate-900/90 animate-pulse" />
          <div className="mt-8 space-y-4">
            <div className="h-8 w-1/3 rounded-full bg-slate-800 animate-pulse" />
            <div className="h-6 w-1/4 rounded-full bg-slate-800 animate-pulse" />
            <div className="space-y-3">
              <div className="h-4 rounded-full bg-slate-800 animate-pulse" />
              <div className="h-4 rounded-full bg-slate-800 animate-pulse" />
              <div className="h-4 rounded-full bg-slate-800 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-5xl px-4 bg-white rounded-xl border border-gray-300 p-12 text-center shadow-md">
        <h1 className="text-3xl font-semibold text-slate-900">Jurnal tidak ditemukan</h1>
        <p className="mt-4 text-slate-700">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/journal')}
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-teal-700 transition"
        >
          Kembali ke Jurnal
        </button>
      </section>
    );
  }

  if (!journal) {
    return null;
  }

  const { title, destination, date, description, createdAt, latitude, longitude, photo_url } = journal;
  const mapCenter = latitude && longitude ? [latitude, longitude] : indonesiaCenter;

  return (
    <div className="mx-auto max-w-6xl px-4 space-y-6">
      <section className="bg-white rounded-xl overflow-hidden border border-gray-300 shadow-md">
        <div className="relative h-96 w-full bg-gray-200">
          <img
            src={photo_url || placeholderImage}
            alt={title || 'Journal cover'}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/10 to-slate-900/70" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-white">
            <p className="text-sm uppercase tracking-[0.35em] text-teal-300 font-semibold">Jurnal Perjalanan</p>
            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">{title || 'Judul tidak tersedia'}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-100">
              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-900/70 px-3 py-2 backdrop-blur-sm">
                📍 {destination || 'Destinasi tidak tersedia'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-900/70 px-3 py-2 backdrop-blur-sm">
                📅 {formatDate(date)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="bg-white rounded-xl border border-gray-300 p-8 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3 no-print mb-8">
            <button
              type="button"
              onClick={() => navigate('/journal')}
              className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50 transition"
            >
              Kembali
            </button>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50 transition no-print"
              >
                Cetak Jurnal
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="rounded-lg bg-teal-600 px-6 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-teal-700 transition no-print"
              >
                Bagikan
              </button>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Tentang Perjalanan</h2>
              <p className="mt-4 leading-8 text-slate-800">{description || 'Deskripsi perjalanan belum tersedia.'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg border border-gray-300 p-6">
              <h3 className="text-xl font-semibold text-slate-900">Detail</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <DetailItem label="Destinasi" value={destination || 'Tidak tersedia'} />
                <DetailItem label="Tanggal" value={formatDate(date)} />
                <DetailItem label="Koordinat" value={latitude && longitude ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : 'Belum dipilih'} />
                <DetailItem label="Dibuat pada" value={formatDate(createdAt)} />
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-md">
            <h3 className="text-xl font-semibold text-slate-900">Peta Lokasi</h3>
            <div className="mt-4 h-80 overflow-hidden rounded-lg border border-gray-300">
              <MapContainer center={mapCenter} zoom={latitude && longitude ? 10 : 4} scrollWheelZoom={false} className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {latitude && longitude && <Marker position={[latitude, longitude]} icon={icon} />}
              </MapContainer>
            </div>
            {!latitude || !longitude ? (
              <p className="mt-4 text-sm text-slate-700">Peta akan menampilkan lokasi ketika latitude dan longitude tersedia.</p>
            ) : null}
            {copyStatus && <p className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-semibold">{copyStatus}</p>}
          </div>
        </aside>
      </section>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-600 font-semibold">{label}</p>
      <p className="mt-2 text-sm text-slate-900">{value}</p>
    </div>
  );
}
