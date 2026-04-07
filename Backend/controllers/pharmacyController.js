// controllers/pharmacyController.js

import Pharmacy from '../models/Pharmacy.js';
import Order from '../models/Order.js';
import Medicine from '../models/Medicine.js';
import Prescription from '../models/Prescription.js';

const DEMO_PHARMACY_NAMES = new Set([
  'Campus Central Pharmacy',
  'North Residence Pharmacy'
]);

function shouldExposeDemoPharmacies() {
  return process.env.ENABLE_DEMO_SEED === 'true';
}

// @desc    Get all pharmacies
// @route   GET /api/pharmacy
// @access  Public
const getPharmacies = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    let query = {};

    if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      const parsedRadius = Number(radius);

      if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng) || Number.isNaN(parsedRadius) || parsedRadius <= 0) {
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

    const pharmacies = await Pharmacy.find(query);
    const filteredPharmacies = shouldExposeDemoPharmacies()
      ? pharmacies
      : pharmacies.filter((pharmacy) => !DEMO_PHARMACY_NAMES.has(pharmacy.name));

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
