import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import NotificationBell from './NotificationBell';

const navItems = [
  { label: 'Home', path: '/home' },
  { label: 'Explore', path: '/explore' },
  { label: 'Jurnal', path: '/journal' },
  { label: 'AI Plan', path: '/ai-plan' },
  { label: 'Komunitas', path: '/community' },
];

const activeLink = 'text-teal-600 bg-teal-50 shadow-sm';
const inactiveLink = 'text-slate-600 hover:text-slate-900 hover:bg-slate-100';

function parseUser() {
  const storedUser = localStorage.getItem('tripmate_user');
  if (!storedUser) return { name: 'Traveler', email: 'traveler@tripmate.com' };
  try {
    const user = JSON.parse(storedUser);
    return {
      name: user.name || 'Traveler',
      email: user.email || 'tidak diketahui',
    };
  } catch {
    return { name: 'Traveler', email: 'traveler@tripmate.com' };
  }
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(parseUser());

  useEffect(() => {
    const refreshUser = () => setUser(parseUser());
    refreshUser();
    window.addEventListener('tripmate_user:update', refreshUser);
    return () => window.removeEventListener('tripmate_user:update', refreshUser);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    setDropdownOpen(false);
    toast.success('Sampai jumpa! 👋');
    navigate('/login', { replace: true });
  };

  const initial = user.name?.trim()?.charAt(0).toUpperCase() || 'T';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-teal-500 text-xl text-white shadow-sm shadow-teal-200/30">
            ✈️
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">TripMate</p>
            <p className="text-xs text-slate-500">Travel planning reimagined</p>
          </div>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative rounded-full border px-4 py-2 text-sm font-medium transition duration-200 ${
                  isActive ? activeLink : inactiveLink
                }`
              }
            >
              {({ isActive }) => (
                <span className="relative inline-flex items-center gap-2">
                  {item.label}
                  {isActive && <span className="absolute -bottom-2 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-teal-500" />}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <NotificationBell />

          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((open) => !open)}
              className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:bg-slate-50"
              aria-label="Open user menu"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500 text-sm font-semibold text-white">
                {initial}
              </div>
              <div className="hidden min-w-[120px] flex-col text-sm md:flex">
                <span className="font-semibold text-slate-900">{user.name}</span>
                <span className="text-slate-500 truncate">{user.email}</span>
              </div>
            </button>

            <div
              className={`absolute right-0 top-full z-10 mt-3 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10 transition duration-300 ease-out ${
                dropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
              }`}
            >
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="text-sm text-slate-500 truncate">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/my-bookings');
                  }}
                  className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  Booking Saya
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  Lihat Profile
                </button>
                <div className="h-px bg-slate-200" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-2xl bg-rose-50 px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-100"
                >
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle navigation menu"
        >
          <span className="text-2xl">{mobileOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      <div className={`overflow-hidden border-t border-slate-200 bg-white/95 md:hidden transition-all duration-300 ease-out ${mobileOpen ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-2 px-4 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  isActive ? activeLink : inactiveLink
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-500 truncate">{user.email}</p>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Lihat Profile
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 w-full rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
