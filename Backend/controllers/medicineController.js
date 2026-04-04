// controllers/medicineController.js

import Medicine from '../models/Medicine.js';
import AuditLog from '../models/AuditLog.js';
import cloudinaryService from '../utils/cloudinaryService.js';

const { uploadMedicineImage, deleteFile, isCloudinaryConfigured } = cloudinaryService;

// @desc    Get all medicines
// @route   GET /api/medicines
// @access  Public
const getMedicines = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    if (category && category !== 'All') query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const medicines = await Medicine.find(query)
      .sort({ name: 1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit);

    const total = await Medicine.countDocuments(query);

    res.json({
      medicines,
      totalPages: Math.ceil(total / parsedLimit),
      currentPage: parsedPage,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get medicine by ID
// @route   GET /api/medicines/:id
// @access  Public
const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create medicine
// @route   POST /api/medicines
// @access  Private/Pharmacist
const createMedicine = async (req, res) => {
  try {
    const medicineData = { ...req.body };

    // Numerical and Boolean conversions (Multer brings them as strings)
    if (medicineData.price) medicineData.price = Number(medicineData.price);
    if (medicineData.stock) medicineData.stock = Number(medicineData.stock);
    if (medicineData.reorderLevel) medicineData.reorderLevel = Number(medicineData.reorderLevel);
    
    if (medicineData.requiresPrescription === 'true') medicineData.requiresPrescription = true;
    if (medicineData.requiresPrescription === 'false') medicineData.requiresPrescription = false;
    
    // Generic alternatives parsing (if sent as JSON string in multipart)
    if (typeof medicineData.genericAlternatives === 'string') {
      try {
        medicineData.genericAlternatives = JSON.parse(medicineData.genericAlternatives);
      } catch {
        medicineData.genericAlternatives = medicineData.genericAlternatives.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    if (req.file) {
      if (isCloudinaryConfigured()) {
        const result = await uploadMedicineImage(req.file.path);
        medicineData.image = result.secure_url;
        medicineData.imagePublicId = result.public_id;
      } else {
        medicineData.image = `/uploads/medicines/${req.file.filename}`;
        medicineData.imagePublicId = null;
      }
    }

    const medicine = await Medicine.create(medicineData);

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: 'Medicine Created',
      module: 'Pharmacy',
      details: `Created medicine: ${medicine.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'info',
      timestamp: Date.now()
    });

    res.status(201).json(medicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update medicine
// @route   PUT /api/medicines/:id
// @access  Private/Pharmacist
const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    const updateData = { ...req.body };

    // Numerical and Boolean conversions
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.stock) updateData.stock = Number(updateData.stock);
    if (updateData.reorderLevel) updateData.reorderLevel = Number(updateData.reorderLevel);

    if (updateData.requiresPrescription === 'true') updateData.requiresPrescription = true;
    if (updateData.requiresPrescription === 'false') updateData.requiresPrescription = false;

    // Generic alternatives parsing
    if (typeof updateData.genericAlternatives === 'string') {
      try {
        updateData.genericAlternatives = JSON.parse(updateData.genericAlternatives);
      } catch {
        updateData.genericAlternatives = updateData.genericAlternatives.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    if (req.file) {
      if (medicine.imagePublicId && isCloudinaryConfigured()) {
        await deleteFile(medicine.imagePublicId);
      }

      if (isCloudinaryConfigured()) {
        const result = await uploadMedicineImage(req.file.path);
        updateData.image = result.secure_url;
        updateData.imagePublicId = result.public_id;
      } else {
        updateData.image = `/uploads/medicines/${req.file.filename}`;
        updateData.imagePublicId = null;
      }
    }

    const updatedMedicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: 'Medicine Updated',
      module: 'Pharmacy',
      details: `Updated medicine: ${medicine.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'info',
      timestamp: Date.now()
    });

    res.json(updatedMedicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete medicine
// @route   DELETE /api/medicines/:id
// @access  Private/Pharmacist
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    if (medicine.imagePublicId && isCloudinaryConfigured()) {
      await deleteFile(medicine.imagePublicId);
    }

    await medicine.deleteOne();

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: 'Medicine Deleted',
      module: 'Pharmacy',
      details: `Deleted medicine: ${medicine.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'warning',
      timestamp: Date.now()
    });

    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update stock
// @route   PUT /api/medicines/:id/stock
// @access  Private/Pharmacist
const updateStock = async (req, res) => {
  try {
    const { stock } = req.body;
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { stock, updatedAt: Date.now() },
      { new: true }
    );
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  updateStock
};
