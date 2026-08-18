import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import client, { getErrorMessage } from '../api/client.js';

const ALGERIA_CENTER = [36.7538, 3.0588];
const ALGERIA_ZOOM = 6;
const DEFAULT_COUNTRY = 'DZ';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const RecenterView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const FitMarkers = ({ gyms, enabled }) => {
  const map = useMap();
  useEffect(() => {
    if (enabled && gyms.length > 0) {
      const bounds = L.latLngBounds(gyms.map((g) => [g.location.coordinates[1], g.location.coordinates[0]]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [gyms, enabled, map]);
  return null;
};

const MapPage = () => {
  const [gyms, setGyms] = useState([]);
  const [center, setCenter] = useState(ALGERIA_CENTER);
  const [zoom, setZoom] = useState(ALGERIA_ZOOM);
  const [fitEnabled, setFitEnabled] = useState(false);
  const [filters, setFilters] = useState({ sportType: '', maxMonthlyPrice: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAllGyms = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await client.get('/map/markers', { params: { country: DEFAULT_COUNTRY } });
      setGyms(data.data.gyms);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadNearby = async (lat, lng) => {
    setLoading(true);
    setError('');
    try {
      const params = { lat, lng, radius: 50, country: DEFAULT_COUNTRY };
      if (filters.sportType) params.sportType = filters.sportType;
      if (filters.maxMonthlyPrice) params.maxMonthlyPrice = filters.maxMonthlyPrice;
      const { data } = await client.get('/map/nearby', { params });
      setGyms(data.data.gyms);
      setFitEnabled(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (filters.sportType || filters.maxMonthlyPrice) {
      loadNearby(center[0], center[1]);
    } else {
      loadAllGyms();
    }
  };

  const onLocation = useMemo(
    () => ({
      locate: () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              setCenter([lat, lng]);
              setZoom(12);
              loadNearby(lat, lng);
            },
            () => {
              setError('تعذر تحديد موقعك');
              loadAllGyms();
            },
          );
        } else {
          loadAllGyms();
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    loadAllGyms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1>الخريطة التفاعلية - الجزائر</h1>
      <div className="map-toolbar">
        <select value={filters.sportType} onChange={(e) => setFilters({ ...filters, sportType: e.target.value })}>
          <option value="">كل الرياضات</option>
          <option value="Football">كرة قدم</option>
          <option value="Bodybuilding">كمال أجسام</option>
          <option value="Boxing">ملاكمة</option>
          <option value="Combat">فنون قتالية</option>
          <option value="Mixed">مختلط</option>
        </select>
        <input
          type="number"
          placeholder="الحد الأقصى للسعر الشهري"
          value={filters.maxMonthlyPrice}
          onChange={(e) => setFilters({ ...filters, maxMonthlyPrice: e.target.value })}
        />
        <button className="btn btn-primary" onClick={applyFilters}>بحث</button>
        <button className="btn" onClick={onLocation.locate}>موقعي</button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <p className="muted">جاري تحميل الصالات...</p>}
      <div className="map-container">
        <MapContainer center={ALGERIA_CENTER} zoom={ALGERIA_ZOOM} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterView center={center} zoom={zoom} />
          <FitMarkers gyms={gyms} enabled={fitEnabled} />
          {gyms.map((gym) => (
            <Marker
              key={gym._id}
              position={[gym.location.coordinates[1], gym.location.coordinates[0]]}
              icon={customIcon}
            >
              <Popup>
                <strong>{gym.name}</strong>
                <p>{gym.address}</p>
                <p>{gym.city} {gym.country}</p>
                <p>الرياضات: {gym.sportTypes?.join('، ')}</p>
                <p>شهري: {gym.subscriptionPrices?.monthly}</p>
                {gym.distanceKm !== undefined && <p>المسافة: {gym.distanceKm} كم</p>}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      {!loading && gyms.length === 0 && (
        <p className="muted">لا توجد صالات مسجلة بعد في الجزائر.</p>
      )}
    </div>
  );
};

export default MapPage;