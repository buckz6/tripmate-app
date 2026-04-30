import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import bookingService from '../api/bookingService';
import { showError } from '../utils/toast';

const BookingSuccessPage = () => {
  const { bookingCode } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const bookingData = await bookingService.getByCode(bookingCode);
        setBooking(bookingData);
      } catch (error) {
        showError('Failed to load booking details');
        navigate('/home');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingCode, navigate]);

  const formatRupiah = (num) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(booking.booking_code);
      // Could show a success toast, but for now just copy
    } catch (error) {
      showError('Failed to copy booking code');
    }
  };

  const handleCreateJournal = () => {
    navigate('/journal/create', {
      state: {
        destinationId: booking.destination_id,
        destinationName: booking.destination_name
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Booking not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <svg
                className="w-12 h-12 text-white animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-ping"></div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mt-6 mb-2">
            Booking Berhasil! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            Selamat menikmati perjalanan Anda
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Detail Booking</h2>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-3xl font-mono font-bold text-blue-600">
                {booking.booking_code}
              </span>
              <button
                onClick={copyToClipboard}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy booking code"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="font-medium text-gray-600">Destinasi</span>
              <span className="font-semibold text-gray-900">{booking.destination_name}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="font-medium text-gray-600">Check-in</span>
              <span className="font-semibold text-gray-900">{formatDate(booking.check_in_date)}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="font-medium text-gray-600">Check-out</span>
              <span className="font-semibold text-gray-900">{formatDate(booking.check_out_date)}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="font-medium text-gray-600">Durasi</span>
              <span className="font-semibold text-gray-900">{booking.duration_days} malam</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="font-medium text-gray-600">Total Pembayaran</span>
              <span className="font-semibold text-green-600 text-lg">{formatRupiah(booking.total_price)}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="font-medium text-gray-600">Metode Pembayaran</span>
              <span className="font-semibold text-gray-900">
                {booking.payment_method === 'transfer' && 'Transfer Bank'}
                {booking.payment_method === 'kartu_kredit' && 'Kartu Kredit'}
                {booking.payment_method === 'dompet_digital' && 'Dompet Digital'}
              </span>
            </div>

            <div className="flex justify-between items-center py-3">
              <span className="font-medium text-gray-600">Status</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Confirmed
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/my-bookings')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            Lihat Semua Booking
          </button>

          <button
            onClick={handleCreateJournal}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            Buat Jurnal Perjalanan
          </button>

          <button
            onClick={() => navigate('/home')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;