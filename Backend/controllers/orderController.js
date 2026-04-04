// controllers/orderController.js

import Order from '../models/Order.js';
import Medicine from '../models/Medicine.js';
import Prescription from '../models/Prescription.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import emailService from '../utils/emailService.js';

// @desc    Create order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { items, address, paymentMethod, specialInstructions, prescriptionId } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one order item is required' });
    }

    let subtotal = 0;
    const orderItems = [];
    let hasPrescriptionMedicine = false;

    for (const item of items) {
      if (!item?.medicineId || !item?.quantity || Number(item.quantity) <= 0) {
        return res.status(400).json({ message: 'Each item must include a valid medicineId and quantity' });
      }
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) {
        return res.status(404).json({ message: `Medicine not found: ${item.medicineId}` });
      }

      if (medicine.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${medicine.name}` });
      }

      subtotal += medicine.price * item.quantity;
      if (medicine.requiresPrescription) {
        hasPrescriptionMedicine = true;
      }
      orderItems.push({
        medicineId: medicine._id,
        name: medicine.name,
        price: medicine.price,
        quantity: item.quantity,
        requiresPrescription: medicine.requiresPrescription
      });
    }

    if (hasPrescriptionMedicine) {
      if (!prescriptionId) {
        return res.status(400).json({
          message: 'Prescription is required for one or more selected medicines'
        });
      }

      const prescription = await Prescription.findById(prescriptionId);
      if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found' });
      }

      if (prescription.studentId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only use your own prescription' });
      }

      if (prescription.status !== 'Approved') {
        return res.status(400).json({
          message: `Prescription status must be Approved. Current status: ${prescription.status}`
        });
      }
    }

    const deliveryFee = 2.5;
    const total = subtotal + deliveryFee;

    const order = await Order.create({
      studentId: req.user.id,
      studentName: req.user.name,
      studentEmail: req.user.email,
      studentPhone: req.user.phone,
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      address,
      specialInstructions,
      prescriptionId,
      status: 'Pending'
    });

    // Update stock
    for (const item of orderItems) {
      await Medicine.findByIdAndUpdate(item.medicineId, {
        $inc: { stock: -item.quantity }
      });
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { studentId: req.user.id };

    if (status && status !== 'All') query.status = status;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / parsedLimit),
      currentPage: parsedPage,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('studentId', 'name email phone')
      .populate('prescriptionId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (
      order.studentId._id.toString() !== req.user.id &&
      req.user.role !== 'pharmacist' &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Pharmacist
const updateOrderStatus = async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    const order = await Order.findById(req.params.id).populate('studentId', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;

    if (status === 'Delivered') {
      order.deliveredAt = Date.now();
    }
    if (status === 'Cancelled') {
      order.cancelledAt = Date.now();
      order.cancellationReason = cancellationReason;

      for (const item of order.items) {
        await Medicine.findByIdAndUpdate(item.medicineId, {
          $inc: { stock: item.quantity }
        });
      }
    }

    await order.save();

    await Notification.create({
      title: `Order ${status}`,
      message: `Your order #${order.orderId} has been ${status.toLowerCase()}`,
      type: 'order',
      target: 'Specific User',
      targetUsers: [order.studentId._id],
      recipients: [order.studentId._id],
      link: `/student/pharmacy/order/${order._id}`,
      createdBy: req.user.id,
      status: 'Sent',
      sentAt: Date.now()
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (Pharmacist)
// @route   GET /api/orders/all
// @access  Private/Pharmacist
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'All') query.status = status;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const orders = await Order.find(query)
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / parsedLimit),
      currentPage: parsedPage,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders
};
