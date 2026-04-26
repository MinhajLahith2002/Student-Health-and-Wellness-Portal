import { Router } from 'express';
const router = Router();

import orderController from '../controllers/orderController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const {
  createOrder,
  resolveOrderPricing,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders
} = orderController;

const { protect } = authMiddleware;
const { authorize } = roleMiddleware;

// Protected routes
router.get('/', protect, getOrders);
router.get('/all', protect, authorize('pharmacist'), getAllOrders);
router.get('/:id', protect, getOrderById);
router.post('/', protect, authorize('student'), createOrder);
router.put('/:id/pricing', protect, authorize('pharmacist'), resolveOrderPricing);
router.put('/:id/status', protect, authorize('pharmacist'), updateOrderStatus);

export default router;
