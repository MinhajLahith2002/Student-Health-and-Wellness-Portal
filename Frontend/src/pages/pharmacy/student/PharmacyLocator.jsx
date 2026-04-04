import React, { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Navigation,
  Clock,
  Users,
  ChevronRight,
  Search,
  Phone,
  AlertCircle,
  ChevronLeft,
  Loader2,
  LocateFixed,
  RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { apiFetch } from '../../../lib/api';

const DEFAULT_RADIUS_KM = 10;

const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function haversineDistanceKm(from, to) {
  if (!from || !to) return null;

  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getPharmacyCoordinates(pharmacy) {
  const coordinates = pharmacy?.location?.coordinates;
  if (Array.isArray(coordinates) && coordinates.length === 2) {
    return { lng: coordinates[0], lat: coordinates[1] };
  }

  if (typeof pharmacy?.location?.lat === 'number' && typeof pharmacy?.location?.lng === 'number') {
    return { lat: pharmacy.location.lat, lng: pharmacy.location.lng };
  }

  return null;
}

function formatHours(openingHours) {
  const todayKey = dayKeys[new Date().getDay()];
  const hours = openingHours?.[todayKey];
  if (!hours?.open || !hours?.close) return 'Hours unavailable';
  return `${hours.open} - ${hours.close}`;
}

function normalizePharmacies(pharmacies, userLocation) {
  return pharmacies.map((pharmacy) => {
    const coords = getPharmacyCoordinates(pharmacy);
    const distanceKm = coords && userLocation ? haversineDistanceKm(userLocation, coords) : null;
    const id = pharmacy._id || pharmacy.id;

    return {
      ...pharmacy,
      id,
      coords,
      distanceKm,
      waitTime: pharmacy.estimatedWaitTime ?? pharmacy.queueLength * 2 ?? 0,
      todayHours: formatHours(pharmacy.openingHours)
    };
  });
}

function getMapPoints(pharmacies, userLocation) {
  const points = pharmacies
    .filter((item) => item.coords)
    .map((item) => ({ id: item.id, ...item.coords, type: 'pharmacy' }));

  if (userLocation) {
    points.push({ id: 'user-location', ...userLocation, type: 'user' });
  }

  if (points.length === 0) return [];

  const latitudes = points.map((point) => point.lat);
  const longitudes = points.map((point) => point.lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latRange = Math.max(maxLat - minLat, 0.01);
  const lngRange = Math.max(maxLng - minLng, 0.01);

  return points.map((point) => ({
    ...point,
    left: 12 + ((point.lng - minLng) / lngRange) * 76,
    top: 12 + (1 - (point.lat - minLat) / latRange) * 76
  }));
}

const PharmacyLocator = () => {
  const navigate = useNavigate();
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);

  const loadPharmacies = async (location = userLocation, radius = radiusKm) => {
    setLoading(true);
    setError('');

    try {
      const query = location
        ? `?lat=${encodeURIComponent(location.lat)}&lng=${encodeURIComponent(location.lng)}&radius=${encodeURIComponent(radius)}`
        : '';
      const data = await apiFetch(`/pharmacy${query}`);
      const normalized = normalizePharmacies(Array.isArray(data) ? data : [], location).sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });

      setPharmacies(normalized);
      setSelectedPharmacy((current) => {
        if (current && normalized.some((item) => item.id === current)) return current;
        return normalized[0]?.id || null;
      });
    } catch (err) {
      setError(err.message || 'Failed to load nearby pharmacies');
    } finally {
      setLoading(false);
    }
  };

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Location services are not available in this browser. Showing all pharmacies instead.');
      loadPharmacies(null, radiusKm);
      return;
    }

    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(nextLocation);
        loadPharmacies(nextLocation, radiusKm);
      },
      () => {
        setLocationError('Location permission was denied, so all pharmacies are shown without distance ranking.');
        loadPharmacies(null, radiusKm);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    requestUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      loadPharmacies(userLocation, radiusKm);
    }
  }, [radiusKm]);

  const filteredPharmacies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return pharmacies;

    return pharmacies.filter((pharmacy) =>
      [pharmacy.name, pharmacy.address, pharmacy.services?.join(' ')].filter(Boolean).some((value) => value.toLowerCase().includes(query))
    );
  }, [pharmacies, searchQuery]);

  const currentPharmacy = filteredPharmacies.find((p) => p.id === selectedPharmacy) || pharmacies.find((p) => p.id === selectedPharmacy) || null;
  const mapPoints = getMapPoints(filteredPharmacies.length > 0 ? filteredPharmacies : pharmacies, userLocation);

  return (
    <div className="h-screen bg-[#eff6f9] flex flex-col overflow-hidden">
      <div className="pharmacy-hero px-6 py-4 shrink-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/student/pharmacy')}
              className="p-2 hover:bg-[#e6f0f4] rounded-full transition-colors text-secondary-text"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-primary-text">Pharmacy Locator</h1>
              <p className="text-sm text-secondary-text">Find the nearest pharmacy based on your current location.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text/80" />
              <input
                type="text"
                placeholder="Search by name or service..."
                className="pl-10 pr-4 py-2 bg-[#e6f0f4] border-none rounded-xl text-sm focus:ring-2 focus:ring-accent-primary transition-all w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 bg-[#e6f0f4] rounded-xl px-3 py-2 text-sm font-medium text-secondary-text">
              <span>Radius</span>
              <button
                onClick={() => setRadiusKm((current) => Math.max(1, current - 1))}
                className="w-7 h-7 rounded-lg bg-white hover:bg-[#eff6f9] border border-slate-200"
                type="button"
              >
                -
              </button>
              <span className="min-w-12 text-center">{radiusKm} km</span>
              <button
                onClick={() => setRadiusKm((current) => Math.min(50, current + 1))}
                className="w-7 h-7 rounded-lg bg-white hover:bg-[#eff6f9] border border-slate-200"
                type="button"
              >
                +
              </button>
            </div>
            <button
              onClick={requestUserLocation}
              className="px-4 py-2 bg-accent-primary text-white rounded-xl font-semibold hover:bg-[#105f72] transition-all flex items-center gap-2"
              type="button"
            >
              <LocateFixed className="w-4 h-4" /> Use My Location
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-full md:w-[420px] bg-white border-r border-slate-200 overflow-y-auto z-20 shadow-xl md:shadow-none">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-primary-text">Nearby Pharmacies</h2>
              <span className="text-xs font-bold text-secondary-text/80 uppercase tracking-widest">{filteredPharmacies.length} Found</span>
            </div>

            {locationError && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-800">
                {locationError}
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm text-rose-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="py-24 text-center">
                <Loader2 className="w-8 h-8 text-accent-primary animate-spin mx-auto mb-4" />
                <p className="text-secondary-text font-medium">Loading pharmacies...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPharmacies.map((pharmacy) => (
                  <motion.button
                    key={pharmacy.id}
                    onClick={() => setSelectedPharmacy(pharmacy.id)}
                    whileHover={{ scale: 1.01 }}
                    className={cn(
                      'w-full p-5 rounded-2xl border-2 text-left transition-all flex flex-col gap-3 group',
                      selectedPharmacy === pharmacy.id
                        ? 'border-accent-primary bg-[#e8f7f5]/50'
                        : 'border-slate-50 bg-[#eff6f9] hover:border-emerald-200'
                    )}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0',
                          selectedPharmacy === pharmacy.id ? 'bg-accent-primary text-white' : 'bg-white text-accent-primary shadow-sm'
                        )}>
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className={cn('font-bold text-sm truncate', selectedPharmacy === pharmacy.id ? 'text-emerald-900' : 'text-primary-text')}>
                            {pharmacy.name}
                          </h3>
                          <p className="text-xs text-secondary-text line-clamp-2">{pharmacy.address}</p>
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        'w-4 h-4 transition-transform shrink-0',
                        selectedPharmacy === pharmacy.id ? 'text-accent-primary translate-x-1' : 'text-slate-300'
                      )} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/50 text-[11px] font-semibold uppercase tracking-wider">
                      <div className="flex items-center gap-1.5 text-secondary-text">
                        <Users className="w-3 h-3 text-secondary-text/80" />
                        <span className={pharmacy.queueLength > 10 ? 'text-amber-600' : 'text-accent-primary'}>
                          ~{pharmacy.waitTime} min wait
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-secondary-text">
                        <Navigation className="w-3 h-3 text-secondary-text/80" />
                        <span>{pharmacy.distanceKm != null ? `${pharmacy.distanceKm.toFixed(1)} km` : 'Distance N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-secondary-text col-span-2">
                        <Clock className="w-3 h-3 text-secondary-text/80" />
                        <span>{pharmacy.todayHours}</span>
                      </div>
                    </div>
                  </motion.button>
                ))}

                {!loading && filteredPharmacies.length === 0 && (
                  <div className="py-20 text-center bg-[#eff6f9] rounded-3xl border border-slate-200 border-dashed">
                    <p className="text-secondary-text font-medium">No pharmacies matched your search.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-[#e6f0f4] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.12),_transparent_26%),linear-gradient(135deg,_#f8fafc,_#e2e8f0)]" />
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.15) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

          <div className="absolute inset-0">
            {mapPoints.map((point) => {
              const isSelected = point.type === 'pharmacy' && selectedPharmacy === point.id;
              const pharmacy = pharmacies.find((item) => item.id === point.id);

              return (
                <motion.button
                  key={point.id}
                  onClick={() => point.type === 'pharmacy' && setSelectedPharmacy(point.id)}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.08 }}
                  className={cn(
                    'absolute -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg transition-all z-10 flex items-center justify-center',
                    point.type === 'user' ? 'w-12 h-12 bg-slate-900 text-white' : 'w-14 h-14',
                    point.type === 'pharmacy' && (isSelected ? 'bg-accent-primary text-white scale-110' : 'bg-white text-accent-primary')
                  )}
                  style={{ left: `${point.left}%`, top: `${point.top}%` }}
                  type="button"
                  title={point.type === 'user' ? 'Your location' : pharmacy?.name}
                >
                  {point.type === 'user' ? <LocateFixed className="w-5 h-5" /> : <MapPin className="w-6 h-6" />}
                  {isSelected && <div className="absolute inset-0 rounded-full ring-4 ring-emerald-500/30 animate-ping" />}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {currentPharmacy && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 z-30"
              >
                <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200 overflow-hidden">
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6 gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-16 h-16 bg-[#e8f7f5] rounded-2xl flex items-center justify-center text-accent-primary shrink-0">
                          <MapPin className="w-8 h-8" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-2xl font-bold text-primary-text truncate">{currentPharmacy.name}</h2>
                          <p className="text-secondary-text">{currentPharmacy.address}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedPharmacy(null)}
                        className="p-2 hover:bg-[#e6f0f4] rounded-full transition-colors"
                        type="button"
                      >
                        <AlertCircle className="w-6 h-6 text-slate-300 rotate-45" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <div className="p-4 bg-[#eff6f9] rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-secondary-text/80 uppercase tracking-widest mb-1">Queue Status</p>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-accent-primary" />
                          <span className="font-bold text-primary-text">{currentPharmacy.queueLength} People Waiting</span>
                        </div>
                        <p className="text-[10px] text-accent-primary font-bold mt-1 uppercase tracking-wider">~{currentPharmacy.waitTime} min wait</p>
                      </div>
                      <div className="p-4 bg-[#eff6f9] rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-secondary-text/80 uppercase tracking-widest mb-1">Distance</p>
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-secondary-text/80" />
                          <span className="font-bold text-primary-text">{currentPharmacy.distanceKm != null ? `${currentPharmacy.distanceKm.toFixed(1)} km away` : 'Distance unavailable'}</span>
                        </div>
                        <p className="text-[10px] text-accent-primary font-bold mt-1 uppercase tracking-wider">{currentPharmacy.todayHours}</p>
                      </div>
                    </div>

                    {Array.isArray(currentPharmacy.services) && currentPharmacy.services.length > 0 && (
                      <div className="mb-8">
                        <p className="text-[10px] font-bold text-secondary-text/80 uppercase tracking-widest mb-3">Services</p>
                        <div className="flex flex-wrap gap-2">
                          {currentPharmacy.services.map((service) => (
                            <span key={service} className="px-3 py-2 bg-[#e6f0f4] rounded-full text-xs font-semibold text-secondary-text">
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 flex-wrap">
                      <a
                        href={currentPharmacy.coords ? `https://www.google.com/maps/dir/?api=1&destination=${currentPharmacy.coords.lat},${currentPharmacy.coords.lng}` : '#'}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          'flex-1 min-w-[220px] py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-100',
                          currentPharmacy.coords ? 'bg-accent-primary text-white hover:bg-[#105f72]' : 'bg-[#e6f0f4] text-secondary-text/80 pointer-events-none shadow-none'
                        )}
                      >
                        <Navigation className="w-5 h-5" /> Get Directions
                      </a>
                      <a
                        href={currentPharmacy.phone ? `tel:${currentPharmacy.phone}` : '#'}
                        className={cn(
                          'w-14 h-14 rounded-xl flex items-center justify-center transition-all',
                          currentPharmacy.phone ? 'bg-[#e6f0f4] text-secondary-text hover:bg-slate-200' : 'bg-[#e6f0f4] text-slate-300 pointer-events-none'
                        )}
                      >
                        <Phone className="w-5 h-5" />
                      </a>
                      <button
                        onClick={() => loadPharmacies(userLocation, radiusKm)}
                        className="w-14 h-14 bg-[#e6f0f4] text-secondary-text rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all"
                        type="button"
                      >
                        <RefreshCcw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PharmacyLocator;


