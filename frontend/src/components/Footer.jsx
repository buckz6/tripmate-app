import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white px-4 py-10 text-slate-600 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-teal-500 text-xl text-white shadow-sm shadow-teal-200/20">
              ✈️
            </div>
            <div>
              <p className="text-lg font-semibold text-white">TripMate</p>
              <p className="text-sm text-slate-400">Travel planning reimagined.</p>
            </div>
          </div>
          <p className="max-w-md text-sm text-slate-500">Simpan perjalanan, temukan destinasi baru, dan buat setiap momen perjalanan menjadi mudah diingat.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Home', path: '/home' },
            { label: 'Explore', path: '/explore' },
            { label: 'Komunitas', path: '/community' },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-teal-400 hover:bg-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-10 border-t border-slate-900/30 pt-6 text-center text-sm text-slate-500">
        © 2026 TripMate. All rights reserved.
      </div>
    </footer>
  );
}
