import { Router } from 'express';
const router = Router();

import medicineController from '../controllers/medicineController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import uploadMiddleware from '../middleware/uploadMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import validationMiddleware from '../middleware/validationMiddleware.js';

const {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  updateStock
} = medicineController;

const { protect } = authMiddleware;
const { upload } = uploadMiddleware;
const { authorize } = roleMiddleware;
const { medicineValidationRules, validate } = validationMiddleware;

// Public routes
router.get('/', getMedicines);
router.get('/:id', getMedicineById);

// Protected routes (Pharmacist only)
router.post('/', protect, authorize('pharmacist'), upload.single('image'), medicineValidationRules(), validate, createMedicine);
router.put('/:id', protect, authorize('pharmacist'), upload.single('image'), medicineValidationRules(), validate, updateMedicine);
router.put('/:id/stock', protect, authorize('pharmacist'), updateStock);
router.delete('/:id', protect, authorize('pharmacist'), deleteMedicine);

export default router;
