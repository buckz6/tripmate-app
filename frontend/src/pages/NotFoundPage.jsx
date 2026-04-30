import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="bg-white rounded-xl border border-gray-300 p-10 text-center shadow-md">
        <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-teal-100 text-5xl shadow-md">
          ❓
        </div>
        <p className="text-sm uppercase tracking-[0.35em] text-teal-600 font-semibold">404 — Halaman tidak ditemukan</p>
        <h1 className="mt-4 text-5xl font-bold text-slate-900">Oops! Halaman hilang.</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Sepertinya rute yang kamu cari tidak tersedia. Kembali ke halaman utama atau jelajahi fitur TripMate lainnya.
        </p>
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-teal-600 px-8 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-teal-700 transition"
        >
          Kembali ke Home
        </button>
      </div>
    </div>
  );
}
