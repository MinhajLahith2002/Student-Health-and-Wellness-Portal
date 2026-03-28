// controllers/pharmacyController.js

import Pharmacy from '../models/Pharmacy.js';
import Order from '../models/Order.js';
import Medicine from '../models/Medicine.js';
import Prescription from '../models/Prescription.js';

// @desc    Get all pharmacies
// @route   GET /api/pharmacy
// @access  Public
const getPharmacies = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    let query = {};

    if (lat && lng) {
      query = {
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: radius * 1000
          }
        }
      };
    }

    const pharmacies = await Pharmacy.find(query);
    res.json(pharmacies);
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
    const { queueLength } = req.body;
    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      { queueLength, updatedAt: Date.now() },
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
