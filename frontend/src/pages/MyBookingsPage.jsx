import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bookingService from '../api/bookingService';
import { showError, showSuccess } from '../utils/toast';

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await bookingService.getAll();
      setBookings(data);
    } catch (error) {
      showError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Yakin ingin membatalkan booking ini?')) return;

    try {
      await bookingService.cancel(id);
      showSuccess('Booking berhasil dibatalkan');
      fetchBookings(); // Refresh list
    } catch (error) {
      showError('Failed to cancel booking');
    }
  };

  const handleCreateJournal = (booking) => {
    navigate('/journal/create', {
      state: {
        destinationId: booking.destination_id,
        destinationName: booking.destination_name
      }
    });
  };

  const formatRupiah = (num) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status === 'confirmed' ? 'Confirmed' : status === 'pending' ? 'Pending' : status === 'cancelled' ? 'Cancelled' : status}
      </span>
    );
  };

  const BookingSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex items-start space-x-4">
        <div className="w-20 h-20 bg-gray-300 rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-300 rounded w-full"></div>
        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Riwayat Booking Saya</h1>

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <BookingSkeleton key={i} />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Belum ada booking</h2>
          <p className="text-gray-600 mb-6">Mulai perjalanan impian Anda dengan mencari destinasi menarik</p>
          <button
            onClick={() => navigate('/explore')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            Cari Destinasi
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
                <img
                  src={booking.destination_image}
                  alt={booking.destination_name}
                  className="w-full md:w-24 h-48 md:h-24 object-cover rounded-lg mb-4 md:mb-0"
                />
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{booking.destination_name}</h3>
                      <p className="text-gray-600">{booking.destination_province}</p>
                      <p className="text-sm font-mono font-bold text-blue-600 mt-1">{booking.booking_code}</p>
                    </div>
                    <div className="mt-2 md:mt-0">
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Check-in → Check-out</p>
                      <p className="font-medium">
                        {formatDate(booking.check_in_date)} → {formatDate(booking.check_out_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Durasi & Total</p>
                      <p className="font-medium">
                        {booking.duration_days} malam • {formatRupiah(booking.total_price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                      >
                        Batalkan
                      </button>
                    )}
                    <button
                      onClick={() => handleCreateJournal(booking)}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                    >
                      Buat Jurnal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;