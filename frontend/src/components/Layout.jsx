import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const titleMap = {
  '/home': 'Home | TripMate',
  '/explore': 'Explore | TripMate',
  '/journal': 'Jurnal | TripMate',
  '/journal/create': 'Buat Jurnal | TripMate',
  '/ai-plan': 'AI Trip Planner | TripMate',
  '/community': 'Komunitas | TripMate',
  '/profile': 'Profil | TripMate',
  '/login': 'Login | TripMate',
  '/register': 'Daftar | TripMate',
};

export default function Layout() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = titleMap[path] || 'TripMate';

    if (path.startsWith('/journal/') && path !== '/journal/create') {
      title = 'Detail Jurnal | TripMate';
    }

    document.title = title;
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="pt-24">
        <div className="page-container">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
