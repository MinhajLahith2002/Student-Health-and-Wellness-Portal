// OrderService.js

import Order from '../models/Order.js';
import Medicine from '../models/Medicine.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendOrderConfirmation } from '../utils/emailService.js';
import { emitToUser } from '../utils/socket.js';
import { generateOrderId, formatCurrency } from '../utils/helpers.js';

/**
 * Service class for order operations
 */
class OrderService {
  /**
   * Create a new order
   * @param {Object} data - Order data
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Created order
   */
  static async createOrder(data, studentId) {
    const { items, address, paymentMethod, specialInstructions, prescriptionId } = data;

    // Get student details
    const student = await User.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // Validate items and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) {
        throw new Error(`Medicine not found: ${item.medicineId}`);
      }

      if (medicine.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${medicine.name}. Available: ${medicine.stock}`);
      }

      if (medicine.requiresPrescription && !prescriptionId) {
        throw new Error(`Prescription required for ${medicine.name}`);
      }

      const itemTotal = medicine.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        medicineId: medicine._id,
        name: medicine.name,
        price: medicine.price,
        quantity: item.quantity,
        requiresPrescription: medicine.requiresPrescription
      });
    }

    const deliveryFee = 2.5;
    const total = subtotal + deliveryFee;

    // Get order count for generating order ID
    const orderCount = await Order.countDocuments();
    const orderId = generateOrderId(orderCount + 1);

    // Create order
    const order = await Order.create({
      orderId,
      studentId,
      studentName: student.name,
      studentEmail: student.email,
      studentPhone: student.phone,
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

    // Send confirmation email
    await sendOrderConfirmation(order, student);

    // Create notification
    await Notification.create({
      title: 'Order Confirmed',
      message: `Your order #${order.orderId} has been confirmed and is being processed.`,
      type: 'order',
      target: 'Specific User',
      targetUsers: [studentId],
      recipients: [studentId],
      link: `/student/pharmacy/order/${order._id}`,
      createdBy: studentId
    });

    // Emit socket notification
    emitToUser(studentId, 'order-created', {
      orderId: order.orderId,
      total: formatCurrency(total)
    });

    return order;
  }

  /**
   * Get user orders
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Orders and metadata
   */
  static async getUserOrders(userId, filters = {}) {
    const { status, page = 1, limit = 20 } = filters;
    const query = { studentId: userId };

    if (status && status !== 'All') query.status = status;

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .skip(skip),
      Order.countDocuments(query)
    ]);

    return {
      orders,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get all orders (for pharmacist)
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Orders and metadata
   */
  static async getAllOrders(filters = {}) {
    const { status, page = 1, limit = 20, search } = filters;
    const query = {};

    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('studentId', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .skip(skip),
      Order.countDocuments(query)
    ]);

    return {
      orders,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @returns {Promise<Object>} Order details
   */
  static async getOrderById(orderId, userId, role) {
    const order = await Order.findById(orderId)
      .populate('studentId', 'name email phone address')
      .populate('prescriptionId');

    if (!order) {
      throw new Error('Order not found');
    }

    // Check authorization
    const isAuthorized =
      (order.studentId && order.studentId._id.toString() === userId) ||
      role === 'pharmacist' ||
      role === 'admin';

    if (!isAuthorized) {
      throw new Error('Unauthorized to view this order');
    }

    return order;
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   * @param {string} pharmacistId - Pharmacist ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Updated order
   */
  static async updateOrderStatus(orderId, status, pharmacistId, options = {}) {
    const { cancellationReason, trackingNumber } = options;

    const order = await Order.findById(orderId)
      .populate('studentId', 'name email');

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'Delivered' || order.status === 'Cancelled') {
      throw new Error(`Cannot update order that is already ${order.status.toLowerCase()}`);
    }

    const oldStatus = order.status;
    order.status = status;

    if (status === 'Packed') {
      order.packedAt = Date.now();
    }

    if (status === 'Dispatched') {
      order.dispatchedAt = Date.now();
      if (trackingNumber) order.trackingNumber = trackingNumber;
    }

    if (status === 'Delivered') {
      order.deliveredAt = Date.now();
    }

    if (status === 'Cancelled') {
      order.cancelledAt = Date.now();
      order.cancellationReason = cancellationReason;

      // Restore stock
      for (const item of order.items) {
        await Medicine.findByIdAndUpdate(item.medicineId, {
          $inc: { stock: item.quantity }
        });
      }
    }

    await order.save();

    // Create notification for student
    await Notification.create({
      title: `Order ${status}`,
      message: `Your order #${order.orderId} has been ${status.toLowerCase()}`,
      type: 'order',
      target: 'Specific User',
      targetUsers: [order.studentId._id],
      recipients: [order.studentId._id],
      link: `/student/pharmacy/order/${order._id}`,
      createdBy: pharmacistId
    });

    // Emit socket notification
    emitToUser(order.studentId._id, 'order-status-update', {
      orderId: order.orderId,
      status,
      oldStatus,
      trackingNumber: order.trackingNumber
    });

    return order;
  }

  /**
   * Cancel order (by student)
   * @param {string} orderId - Order ID
   * @param {string} studentId - Student ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancelled order
   */
  static async cancelOrder(orderId, studentId, reason) {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.studentId.toString() !== studentId) {
      throw new Error('Unauthorized to cancel this order');
    }

    if (order.status !== 'Pending') {
      throw new Error('Order cannot be cancelled at this stage');
    }

    order.status = 'Cancelled';
    order.cancelledAt = Date.now();
    order.cancellationReason = reason;

    // Restore stock
    for (const item of order.items) {
      await Medicine.findByIdAndUpdate(item.medicineId, {
        $inc: { stock: item.quantity }
      });
    }

    await order.save();

    return order;
  }

  /**
   * Get order statistics
   * @returns {Promise<Object>} Statistics
   */
  static async getOrderStats() {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);

    const statsMap = {
      pending: 0,
      verified: 0,
      packed: 0,
      dispatched: 0,
      delivered: 0,
      cancelled: 0,
      revenue: 0
    };

    stats.forEach(s => {
      const key = (s._id || '').toString().toLowerCase();
      statsMap[key] = s.count || 0;
      if (s._id === 'Delivered') {
        statsMap.revenue = s.totalRevenue || 0;
      }
    });

    const total = stats.reduce((sum, s) => sum + (s.count || 0), 0);

    return {
      total,
      ...statsMap
    };
  }
}

export default OrderService;
