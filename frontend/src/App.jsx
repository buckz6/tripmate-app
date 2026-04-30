import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JournalPage from './pages/JournalPage';
import CreateJournalPage from './pages/CreateJournalPage';
import JournalDetailPage from './pages/JournalDetailPage';
import ExplorePage from './pages/ExplorePage';
import AIPlan from './pages/AIPlan';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';
import BookingPage from './pages/BookingPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import MyBookingsPage from './pages/MyBookingsPage';
import NotFoundPage from './pages/NotFoundPage';

function AuthLogoutListener() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (e) => {
      const from = e.detail?.from || '/';
      navigate(`/login?redirect=${encodeURIComponent(from)}`, { replace: true });
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [navigate]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthLogoutListener />
        <Toaster position="top-right" />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            <Route path="/journal" element={<PrivateRoute><JournalPage /></PrivateRoute>} />
            <Route path="/journal/create" element={<PrivateRoute><CreateJournalPage /></PrivateRoute>} />
            <Route path="/journal/:id" element={<PrivateRoute><JournalDetailPage /></PrivateRoute>} />
            <Route path="/explore" element={<PrivateRoute><ExplorePage /></PrivateRoute>} />
            <Route path="/booking/:destinationId" element={<PrivateRoute><BookingPage /></PrivateRoute>} />
            <Route path="/booking/success/:bookingCode" element={<PrivateRoute><BookingSuccessPage /></PrivateRoute>} />
            <Route path="/my-bookings" element={<PrivateRoute><MyBookingsPage /></PrivateRoute>} />
            <Route path="/ai-plan" element={<PrivateRoute><AIPlan /></PrivateRoute>} />
            <Route path="/community" element={<PrivateRoute><CommunityPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
