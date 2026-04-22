// controllers/pharmacyController.js

import Pharmacy from '../models/Pharmacy.js';
import Order from '../models/Order.js';
import Medicine from '../models/Medicine.js';
import Prescription from '../models/Prescription.js';

const DEMO_PHARMACY_NAMES = new Set([
  'Campus Central Pharmacy',
  'North Residence Pharmacy'
]);
const NOMINATIM_SEARCH_URL = process.env.NOMINATIM_SEARCH_URL || 'https://nominatim.openstreetmap.org/search';
const MAX_RADIUS_KM = 50;
const MIN_RADIUS_KM = 1;
const LIVE_QUERY_TIMEOUT_MS = 12000;

function shouldExposeDemoPharmacies() {
  return process.env.ENABLE_DEMO_SEED === 'true' || process.env.NODE_ENV !== 'production';
}

function getVisiblePharmacies(pharmacies) {
  if (shouldExposeDemoPharmacies()) {
    return pharmacies;
  }

  const nonDemoPharmacies = pharmacies.filter((pharmacy) => !DEMO_PHARMACY_NAMES.has(pharmacy.name));
  return nonDemoPharmacies.length > 0 ? nonDemoPharmacies : pharmacies;
}

function normalizeRadiusKm(value) {
  const parsedRadius = Number(value);

  if (Number.isNaN(parsedRadius) || parsedRadius <= 0) {
    return null;
  }

  return Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, parsedRadius));
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(from, to) {
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

function buildSearchBounds(lat, lng, radiusKm) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(toRadians(lat)));

  return {
    left: lng - lngDelta,
    right: lng + lngDelta,
    top: lat + latDelta,
    bottom: lat - latDelta
  };
}

function formatLivePharmacyAddress(tags = {}, lat, lng) {
  const explicitAddress = tags['addr:full'];
  if (explicitAddress) return explicitAddress;

  const addressParts = [
    [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ').trim(),
    tags['addr:suburb'],
    tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
    tags['addr:postcode']
  ].filter(Boolean);

  if (addressParts.length > 0) {
    return addressParts.join(', ');
  }

  return `Near ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function createLivePharmacyId(element) {
  return `live-${element.osm_type || 'place'}-${element.osm_id || element.place_id}`;
}

function mapLivePharmacy(element) {
  const lat = Number(element.lat);
  const lng = Number(element.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const address = element.display_name || `Near ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  return {
    _id: createLivePharmacyId(element),
    id: createLivePharmacyId(element),
    name: element.name || address.split(',')[0] || 'Nearby Pharmacy',
    address,
    phone: '',
    email: '',
    openingHours: undefined,
    queueLength: 0,
    estimatedWaitTime: 0,
    isOpen: true,
    services: [],
    source: 'live',
    location: {
      type: 'Point',
      coordinates: [lng, lat],
      lat,
      lng
    }
  };
}

function dedupePharmacies(pharmacies) {
  const seen = new Set();

  return pharmacies.filter((pharmacy) => {
    const coords = pharmacy?.location?.coordinates;
    const key = [
      (pharmacy.name || '').trim().toLowerCase(),
      Array.isArray(coords) ? coords.map((value) => Number(value).toFixed(5)).join(',') : ''
    ].join('|');

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function fetchLivePharmacies(lat, lng, radiusKm) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LIVE_QUERY_TIMEOUT_MS);

  try {
    const bounds = buildSearchBounds(lat, lng, radiusKm);
    const searchParams = new URLSearchParams({
      format: 'jsonv2',
      limit: '50',
      q: 'pharmacy',
      bounded: '1',
      viewbox: `${bounds.left},${bounds.top},${bounds.right},${bounds.bottom}`
    });

    const response = await fetch(`${NOMINATIM_SEARCH_URL}?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'StudentHealthPortal/1.0'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Live pharmacy lookup failed (${response.status})`);
    }

    const data = await response.json();
    const elements = Array.isArray(data) ? data : [];
    const origin = { lat, lng };

    return dedupePharmacies(
      elements
        .map(mapLivePharmacy)
        .filter(Boolean)
        .filter((pharmacy) => {
          const [pharmacyLng, pharmacyLat] = pharmacy.location.coordinates;
          return haversineDistanceKm(origin, { lat: pharmacyLat, lng: pharmacyLng }) <= radiusKm;
        })
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchDatabasePharmacies(query = {}) {
  try {
    const pharmacies = await Pharmacy.find(query).lean();
    return getVisiblePharmacies(pharmacies);
  } catch (error) {
    return {
      error,
      pharmacies: []
    };
}
}

// @desc    Get all pharmacies
// @route   GET /api/pharmacy
// @access  Public
const getPharmacies = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    let query = {};
    let parsedLat;
    let parsedLng;
    let parsedRadius;

    if (lat && lng) {
      parsedLat = parseFloat(lat);
      parsedLng = parseFloat(lng);
      parsedRadius = normalizeRadiusKm(radius);

      if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng) || parsedRadius == null) {
        return res.status(400).json({ message: 'Invalid coordinates or radius' });
      }

      query = {
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parsedLng, parsedLat] },
            $maxDistance: parsedRadius * 1000
          }
        }
      };
    }

    const databaseResult = await fetchDatabasePharmacies(query);
    const filteredPharmacies = Array.isArray(databaseResult) ? databaseResult : databaseResult.pharmacies;

    if (lat && lng) {
      let livePharmacies = [];

      try {
        livePharmacies = await fetchLivePharmacies(parsedLat, parsedLng, parsedRadius);
      } catch (liveError) {
        console.error('Live pharmacy lookup failed:', liveError.message);
      }

      if (!Array.isArray(databaseResult) && databaseResult.error) {
        console.error('Database pharmacy lookup failed:', databaseResult.error.message);
      }

      if (livePharmacies.length > 0) {
        return res.json(livePharmacies);
      }

      return res.json(filteredPharmacies);
    }

    res.json(filteredPharmacies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pharmacy by ID
// @route   GET /api/pharmacy/:id
// @access  Public
const getPharmacyById = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    if (!shouldExposeDemoPharmacies() && DEMO_PHARMACY_NAMES.has(pharmacy.name)) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }
    res.json(pharmacy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update pharmacy queue
// @route   PUT /api/pharmacy/:id/queue
// @access  Private/Pharmacist
const updatePharmacyQueue = async (req, res) => {
  try {
    const queueLength = Number(req.body.queueLength);
    if (Number.isNaN(queueLength) || queueLength < 0) {
      return res.status(400).json({ message: 'queueLength must be a non-negative number' });
    }

    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      {
        queueLength,
        estimatedWaitTime: Math.round(queueLength * 2),
        updatedAt: Date.now()
      },
      { new: true }
    );
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }
    res.json(pharmacy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getPharmacies,
  getPharmacyById,
  updatePharmacyQueue
};
