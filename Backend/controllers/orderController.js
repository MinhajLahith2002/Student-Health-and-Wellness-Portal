// controllers/orderController.js

import Order from '../models/Order.js';
import Medicine from '../models/Medicine.js';
import Prescription from '../models/Prescription.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import emailService from '../utils/emailService.js';
import { buildPrescriptionOrderPricing } from '../utils/prescriptionOrderBuilder.js';

const createPrescriptionOrder = async (prescription) => {
  if (!prescription?.studentId?.email) {
    return null;
  }

  const pricing = await buildPrescriptionOrderPricing(prescription);
  const pricingInstructions = pricing.pricingNotes.length
    ? `Pricing review needed: ${pricing.pricingNotes.join(' ')}`
    : '';

  const specialInstructions = [
    prescription.pharmacistNotes || 'Prescription approved for pharmacy preparation.',
    prescription.deliveryInstructions,
    pricingInstructions
  ].filter(Boolean).join(' ');

  return Order.create({
    studentId: prescription.studentId._id,
    studentName: prescription.studentName || prescription.studentId.name,
    studentEmail: prescription.studentId.email,
    studentPhone: prescription.studentId.phone,
    items: pricing.items,
    subtotal: pricing.subtotal,
    deliveryFee: pricing.deliveryFee,
    total: pricing.total,
    paymentMethod: 'Cash on Delivery',
    address: prescription.deliveryAddress || 'Delivery address pending - confirm with student before dispatch',
    specialInstructions,
    prescriptionId: prescription._id,
    orderType: 'Prescription',
    status: pricing.items.length > 0 ? 'Pending' : 'Pricing Pending'
  });
};

const ensureApprovedPrescriptionOrders = async (studentId = null) => {
  const prescriptionQuery = { status: 'Approved' };
  if (studentId) prescriptionQuery.studentId = studentId;

  const approvedPrescriptions = await Prescription.find(prescriptionQuery)
    .populate('studentId', 'name email phone');

  if (approvedPrescriptions.length === 0) return;

  const prescriptionIds = approvedPrescriptions.map((prescription) => prescription._id);
  const existingOrders = await Order.find({ prescriptionId: { $in: prescriptionIds } });
  const orderedPrescriptionIds = new Set(existingOrders.map((order) => order.prescriptionId?.toString()).filter(Boolean));

  for (const prescription of approvedPrescriptions) {
    const existingOrder = existingOrders.find((order) => order.prescriptionId?.toString() === prescription._id.toString());

    if (!orderedPrescriptionIds.has(prescription._id.toString())) {
      await createPrescriptionOrder(prescription);
    } else if (existingOrder && (existingOrder.items || []).length === 0 && Number(existingOrder.total || 0) === 0) {
      const pricing = await buildPrescriptionOrderPricing(prescription);
      const pricingInstructions = pricing.pricingNotes.length
        ? `Pricing review needed: ${pricing.pricingNotes.join(' ')}`
        : '';

      existingOrder.items = pricing.items;
      existingOrder.subtotal = pricing.subtotal;
      existingOrder.deliveryFee = pricing.deliveryFee;
      existingOrder.total = pricing.total;
      existingOrder.status = pricing.items.length > 0 ? 'Pending' : 'Pricing Pending';
      if (pricingInstructions && !String(existingOrder.specialInstructions || '').includes(pricingInstructions)) {
        existingOrder.specialInstructions = [
          existingOrder.specialInstructions,
          pricingInstructions
        ].filter(Boolean).join(' ');
      }
      await existingOrder.save();
    }
  }
};

// @desc    Create order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { items, address, paymentMethod, specialInstructions, prescriptionId } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one order item is required' });
    }

    const deliveryAddress = String(address || '').trim();
    if (deliveryAddress.length < 8) {
      return res.status(400).json({ message: 'Delivery address is required' });
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
      address: deliveryAddress,
      specialInstructions,
      prescriptionId,
      orderType: prescriptionId ? 'Prescription' : 'Direct',
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

// @desc    Resolve prescription order pricing
// @route   PUT /api/orders/:id/pricing
// @access  Private/Pharmacist
const resolveOrderPricing = async (req, res) => {
  try {
    const { items, deliveryFee = 2.5, pricingNotes = '' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one priced medicine item is required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderType !== 'Prescription') {
      return res.status(400).json({ message: 'Only prescription orders can be manually priced' });
    }

    if (order.status !== 'Pricing Pending') {
      return res.status(400).json({ message: 'Only pricing pending orders can be manually priced' });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.price);

      if (!item?.medicineId || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
        return res.status(400).json({ message: 'Each item must include medicineId, quantity, and price' });
      }

      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine || !medicine.isActive) {
        return res.status(404).json({ message: `Medicine not found or inactive: ${item.medicineId}` });
      }

      if (medicine.stock < quantity) {
        return res.status(400).json({ message: `Only ${medicine.stock} ${medicine.name} available in stock` });
      }

      orderItems.push({
        medicineId: medicine._id,
        name: medicine.name,
        price: unitPrice,
        quantity,
        requiresPrescription: medicine.requiresPrescription
      });
      subtotal += unitPrice * quantity;
    }

    for (const item of orderItems) {
      await Medicine.findByIdAndUpdate(item.medicineId, {
        $inc: { stock: -item.quantity }
      });
    }

    const parsedDeliveryFee = Number(deliveryFee);
    const safeDeliveryFee = Number.isFinite(parsedDeliveryFee) && parsedDeliveryFee >= 0 ? parsedDeliveryFee : 0;

    order.items = orderItems;
    order.subtotal = subtotal;
    order.deliveryFee = safeDeliveryFee;
    order.total = subtotal + safeDeliveryFee;
    order.status = 'Pending';
    order.specialInstructions = [
      order.specialInstructions,
      pricingNotes ? `Pricing note: ${pricingNotes}` : ''
    ].filter(Boolean).join(' ');

    await order.save();

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: 'Prescription Order Priced',
      module: 'Pharmacy',
      details: `Order ID: ${order._id} priced at ${order.total}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'success',
      timestamp: Date.now()
    });

    res.json(order);
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

    await ensureApprovedPrescriptionOrders(req.user.id);

    if (status && status !== 'All') query.status = status;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const orders = await Order.find(query)
      .populate('prescriptionId')
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

    if (status !== 'Cancelled' && order.status === 'Pricing Pending') {
      return res.status(400).json({
        message: 'Resolve prescription medicine pricing before moving this order into fulfillment.'
      });
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

    await ensureApprovedPrescriptionOrders();

    if (status && status !== 'All') query.status = status;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const orders = await Order.find(query)
      .populate('studentId', 'name email')
      .populate('prescriptionId')
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
  resolveOrderPricing,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders
};
