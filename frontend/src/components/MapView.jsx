import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
function LocationMarker({ onLocationAdd }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);

      // Prompt for place name
      const placeName = prompt('Enter a name for this location:');
      if (placeName) {
        onLocationAdd({
          id: Date.now(),
          lat,
          lng,
          name: placeName,
        });
      }
      setPosition(null); // Reset for next click
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>New location</Popup>
    </Marker>
  );
}

export default function MapView() {
  const [savedLocations, setSavedLocations] = useState([
    {
      id: 1,
      lat: -6.2088,
      lng: 106.8456,
      name: 'Jakarta, Indonesia',
    },
    {
      id: 2,
      lat: -7.7956,
      lng: 110.3695,
      name: 'Yogyakarta, Indonesia',
    },
  ]);

  const handleLocationAdd = (newLocation) => {
    setSavedLocations(prev => [...prev, newLocation]);
  };

  // Center on Indonesia
  const center = [-2.5, 117.5];
  const zoom = 5;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-black/20">
        <h2 className="text-xl font-semibold text-white mb-4">Interactive Travel Map</h2>
        <p className="text-slate-400 mb-4">
          Click anywhere on the map to add a new location. Saved locations will appear as markers.
        </p>

        <div className="h-96 rounded-2xl overflow-hidden">
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            className="rounded-2xl"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Saved location markers */}
            {savedLocations.map((location) => (
              <Marker key={location.id} position={[location.lat, location.lng]}>
                <Popup>
                  <div className="text-center">
                    <h3 className="font-semibold text-slate-900">{location.name}</h3>
                    <p className="text-sm text-slate-600">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Handle map clicks */}
            <LocationMarker onLocationAdd={handleLocationAdd} />
          </MapContainer>
        </div>
      </div>

      {/* Saved locations list */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-black/20">
        <h3 className="text-lg font-semibold text-white mb-4">Saved Locations</h3>
        {savedLocations.length === 0 ? (
          <p className="text-slate-400">No locations saved yet. Click on the map to add some!</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedLocations.map((location) => (
              <div
                key={location.id}
                className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4"
              >
                <h4 className="font-semibold text-white">{location.name}</h4>
                <p className="text-sm text-slate-400">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
