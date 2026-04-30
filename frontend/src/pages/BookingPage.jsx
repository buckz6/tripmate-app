import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import destinationService from '../api/destinationService';
import bookingService from '../api/bookingService';
import { showError, showSuccess, showLoading } from '../utils/toast';
import toast from 'react-hot-toast';

const BookingPage = () => {
  const { destinationId } = useParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDestination = async () => {
      try {
        const dest = await destinationService.getOne(destinationId);
        setDestination(dest);
      } catch (error) {
        showError('Failed to load destination');
      }
    };
    fetchDestination();
  }, [destinationId]);

  const calculateDuration = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (end <= start) return 0;
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const duration = calculateDuration();
  const totalPrice = destination ? destination.price_per_night * duration : 0;

  const formatRupiah = (num) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!checkIn || !checkOut || duration <= 0) {
      showError('Please select valid check-in and check-out dates');
      return;
    }
    setLoading(true);
    const toastId = showLoading('Memproses pembayaran...');
    try {
      const payload = {
        destination_id: parseInt(destinationId),
        check_in_date: checkIn,
        check_out_date: checkOut,
        payment_method: paymentMethod,
      };
      const booking = await bookingService.create(payload);
      showSuccess('Booking confirmed!');
      navigate(`/booking/success/${booking.booking_code}`);
    } catch (error) {
      showError('Booking failed. Please try again.');
    } finally {
      setLoading(false);
      toast.dismiss(toastId);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (!destination) return <div className="flex justify-center items-center h-64"><div className="text-lg">Loading destination...</div></div>;

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Destination summary card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row">
          <img src={destination.image} alt={destination.name} className="w-full md:w-1/3 h-48 object-cover rounded-lg mb-4 md:mb-0 md:mr-6" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{destination.name}</h1>
            <p className="text-gray-600 text-lg mb-2">{destination.province}</p>
            <div className="flex items-center mb-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-2xl ${i < Math.floor(destination.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
              ))}
              <span className="ml-2 text-lg">{destination.rating}</span>
            </div>
            <p className="text-xl font-semibold text-green-600">{formatRupiah(destination.price_per_night)} per night</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Detail Booking</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={today}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || today}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {duration > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-2">Rincian Harga</h3>
                <p className="text-gray-700">{formatRupiah(destination.price_per_night)} x {duration} malam = {formatRupiah(totalPrice)}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Metode Pembayaran</label>
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="transfer"
                    checked={paymentMethod === 'transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-lg mr-2">🏦</span>
                  <span className="font-medium">Transfer Bank</span>
                </label>
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="kartu_kredit"
                    checked={paymentMethod === 'kartu_kredit'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-lg mr-2">💳</span>
                  <span className="font-medium">Kartu Kredit</span>
                </label>
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="dompet_digital"
                    checked={paymentMethod === 'dompet_digital'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-lg mr-2">📱</span>
                  <span className="font-medium">Dompet Digital (GoPay/OVO)</span>
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-2xl font-bold mb-6">Ringkasan Pesanan</h2>
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-lg">{destination.name}</p>
              <p className="text-gray-600">{destination.province}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Check-in</p>
              <p className="font-medium">{checkIn || 'Belum dipilih'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Check-out</p>
              <p className="font-medium">{checkOut || 'Belum dipilih'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Durasi</p>
              <p className="font-medium">{duration} malam</p>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-green-600">{formatRupiah(totalPrice)}</p>
            </div>
          </div>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || duration <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg mt-6 transition duration-200"
          >
            {loading ? 'Memproses...' : 'Konfirmasi Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;