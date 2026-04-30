import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';
import api from '../api/axios';
import { showError, showLoading, showSuccess } from '../utils/toast';
import 'leaflet/dist/leaflet.css';

const icon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [25, 41],
  shadowSize: [41, 41],
});

const steps = ['Info Dasar', 'Foto & Lokasi', 'Review & Simpan'];
const indonesiaCenter = [-2.548926, 118.0148634];

function LocationMarker({ selectedLocation, onSelectLocation }) {
  useMapEvents({
    click(e) {
      onSelectLocation(e.latlng);
    },
  });

  return selectedLocation ? <Marker position={selectedLocation} icon={icon} /> : null;
}

export default function CreateJournalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    description: '',
    photoFile: null,
    photoPreview: '',
    photoUrl: '',
    location: null,
  });

  useEffect(() => {
    if (location.state?.prefill) {
      const { destination: prefillDestination, description: prefillDescription } = location.state.prefill;
      setFormData((prev) => ({
        ...prev,
        destination: prefillDestination || prev.destination,
        description: prefillDescription || prev.description,
      }));
    }
  }, [location.state]);

  useEffect(() => {
    return () => {
      if (formData.photoPreview) {
        URL.revokeObjectURL(formData.photoPreview);
      }
    };
  }, [formData.photoPreview]);

  const progress = useMemo(() => `${step + 1} / ${steps.length}`, [step]);

  const handleInput = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handlePhotoChange = async (file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, photoFile: file, photoPreview: preview, photoUrl: '' }));
    setError('');
    setUploadProgress(0);

    try {
      const uploadData = new FormData();
      uploadData.append('photo', file);

      const response = await api.post('/journals/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });

      setFormData((prev) => ({ ...prev, photoUrl: response.data.photo_url || '' }));
      showSuccess('Foto berhasil diunggah.');
    } catch (err) {
      const message = 'Gagal mengunggah foto. Silakan coba lagi.';
      setError(message);
      showError(message);
      setFormData((prev) => ({ ...prev, photoUrl: '' }));
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) handlePhotoChange(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) handlePhotoChange(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const validateStep = () => {
    setError('');
    if (step === 0) {
      const { title, destination, startDate, endDate, description } = formData;
      if (!title || !destination || !startDate || !endDate || !description) {
        setError('Lengkapi semua informasi dasar sebelum melanjutkan.');
        return false;
      }
      if (new Date(endDate) < new Date(startDate)) {
        setError('Tanggal selesai harus berada setelah tanggal mulai.');
        return false;
      }
    }

    if (step === 1) {
      if (!formData.location) {
        setError('Pilih lokasi di peta untuk melanjutkan.');
        return false;
      }
      if (!formData.photoUrl) {
        setError('Unggah foto perjalanan terlebih dahulu sebelum melanjutkan.');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 0));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateStep()) return;
    setIsSubmitting(true);
    setError('');

    const loadingToastId = showLoading('Menyimpan jurnal...');
    try {
      const payload = {
        title: formData.title,
        destination: formData.destination,
        date: formData.startDate,
        description: formData.description,
        photo_url: formData.photoUrl,
        latitude: formData.location?.lat || null,
        longitude: formData.location?.lng || null,
      };

      await api.post('/journals', payload);
      showSuccess('Jurnal berhasil disimpan!');
      setTimeout(() => {
        toast.dismiss(loadingToastId);
        navigate('/journal', { replace: true, state: { message: 'Jurnal berhasil disimpan.' } });
      }, 1500);
    } catch (err) {
      const message = err.response?.data?.error || 'Gagal menyimpan jurnal. Silakan coba lagi.';
      setError(message);
      showError(message);
    } finally {
      toast.dismiss(loadingToastId);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 space-y-8">
      <div className="bg-white rounded-xl p-8 shadow-md">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">Buat Jurnal Baru</p>
            <h1 className="mt-3 text-4xl font-bold text-slate-900">Tulis pengalaman perjalananmu</h1>
            <p className="mt-2 text-slate-600">Ikuti langkah mudah untuk menyimpan cerita perjalanan yang lengkap.</p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-lg bg-gray-100 px-5 py-3 text-sm text-slate-700 ring-1 ring-gray-300">
            <span className="font-semibold text-slate-900">{progress}</span>
            <span>{steps[step]}</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            {steps.map((label, index) => (
              <div key={label} className="flex-1">
                <div className={`mx-auto mb-3 h-2 rounded-full ${index <= step ? 'bg-teal-600' : 'bg-gray-300'} transition`} style={{ width: '100%' }} />
                <p className={`text-center text-xs uppercase tracking-[0.3em] font-semibold ${index === step ? 'text-teal-600' : 'text-gray-500'}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {step === 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <label className="block">
                <span className="mb-3 block text-sm font-semibold text-slate-700">Trip Title</span>
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleInput('title')}
                  placeholder="Contoh: Kuliner Bali"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                />
              </label>

              <label className="block">
                <span className="mb-3 block text-sm font-semibold text-slate-700">Destinasi</span>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={handleInput('destination')}
                  placeholder="Contoh: Ubud, Bali"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                />
              </label>

              <label className="block">
                <span className="mb-3 block text-sm font-semibold text-slate-700">Tanggal Mulai</span>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={handleInput('startDate')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                />
              </label>

              <label className="block">
                <span className="mb-3 block text-sm font-semibold text-slate-700">Tanggal Selesai</span>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={handleInput('endDate')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                />
              </label>

              <label className="lg:col-span-2 block">
                <span className="mb-3 block text-sm font-semibold text-slate-700">Deskripsi Perjalanan</span>
                <textarea
                  value={formData.description}
                  onChange={handleInput('description')}
                  rows={6}
                  placeholder="Cerita singkat perjalanan, highlights, dan pengalamanmu..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition resize-none"
                />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Unggah Foto</label>
                  <div className="text-xs text-slate-600 mb-4">Tarik dan lepas atau klik untuk memilih file.</div>
                  <label
                    htmlFor="photoUpload"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="group flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 text-center transition hover:border-teal-600 hover:bg-teal-50"
                  >
                    {formData.photoPreview ? (
                      <img src={formData.photoPreview} alt="Preview" className="h-48 w-full rounded-lg object-cover" />
                    ) : (
                      <>
                        <span className="mb-3 text-4xl">📷</span>
                        <p className="text-sm text-slate-700 font-semibold">Tarik foto di sini atau klik untuk memilih.</p>
                        <p className="mt-2 text-xs text-slate-600">JPG, PNG, max 5MB.</p>
                      </>
                    )}
                    <input id="photoUpload" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  </label>
                  <div className="mt-4 space-y-3">
                    {uploadProgress > 0 && (
                      <div className="rounded-lg border border-gray-300 bg-white p-3">
                        <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                          <span>Proses unggah</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                          <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}
                    {formData.photoUrl && (
                      <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700 font-semibold">
                        ✓ Foto berhasil diunggah.
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-300 p-4">
                    <p className="mb-4 text-sm font-semibold text-slate-900">Pilih Lokasi</p>
                    <div className="h-80 overflow-hidden rounded-lg border border-gray-300">
                      <MapContainer center={indonesiaCenter} zoom={5} scrollWheelZoom={false} className="h-full w-full">
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker selectedLocation={formData.location} onSelectLocation={(location) => setFormData((prev) => ({ ...prev, location }))} />
                      </MapContainer>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-300 p-4">
                    <p className="mb-3 font-semibold text-slate-900 text-sm">Koordinat</p>
                    {formData.location ? (
                      <div className="space-y-2 text-sm text-slate-700">
                        <p>Latitude: {formData.location.lat.toFixed(5)}</p>
                        <p>Longitude: {formData.location.lng.toFixed(5)}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">Klik pada peta untuk memilih lokasi perjalanan.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="bg-white rounded-xl border border-gray-300 p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">Ringkasan</p>
                <h2 className="mt-4 text-2xl font-bold text-slate-900">Periksa kembali sebelum menyimpan</h2>
                <div className="mt-8 space-y-4 text-sm">
                  <SummaryRow label="Judul" value={formData.title} />
                  <SummaryRow label="Destinasi" value={formData.destination} />
                  <SummaryRow label="Tanggal" value={`${formData.startDate} → ${formData.endDate}`} />
                  <SummaryRow label="Deskripsi" value={formData.description} />
                  <SummaryRow label="Koordinat" value={formData.location ? `${formData.location.lat.toFixed(5)}, ${formData.location.lng.toFixed(5)}` : 'Belum dipilih'} />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-300 p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">Preview Foto</p>
                <div className="mt-4 min-h-[260px] overflow-hidden rounded-lg border border-gray-300 bg-gray-100">
                  {formData.photoPreview ? (
                    <img src={formData.photoPreview} alt="Upload preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center p-8 text-gray-500">Tidak ada foto yang diunggah.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

          <div className="flex flex-col gap-3 border-t border-gray-300 pt-6 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 0}
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Kembali
            </button>
            <div className="flex flex-col gap-3 sm:flex-row">
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-teal-700 transition"
                >
                  Selanjutnya
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-teal-700 disabled:opacity-70 disabled:cursor-not-allowed transition"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Jurnal'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-gray-300 bg-gray-50 p-4">
      <span className="text-xs uppercase tracking-[0.3em] text-slate-600 font-semibold">{label}</span>
      <span className="text-sm leading-6 text-slate-900">{value || 'Belum diisi'}</span>
    </div>
  );
}
