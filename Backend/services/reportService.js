// services/ReportService.js

import Appointment from '../models/Appointment.js';
import Order from '../models/Order.js';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import Feedback from '../models/Feedback.js';
import AuditLog from '../models/AuditLog.js';
import Report from '../models/Report.js';
import { formatCurrency, formatDate, generateOrderId } from '../utils/helpers.js';

/**
 * Service class for report generation
 */
class ReportService {
  static async generateAppointmentReport(params) {
    const { startDate, endDate, doctorId, status } = params;
    const query = {};

    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (doctorId) query.doctorId = doctorId;
    if (status && status !== 'All') query.status = status;

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'name specialty')
      .populate('studentId', 'name')
      .sort({ date: 1 });

    const total = appointments.length;
    const byStatus = {};
    const byDoctor = {};
    const byDay = {};

    appointments.forEach(app => {
      byStatus[app.status] = (byStatus[app.status] || 0) + 1;

      const doctorName = app.doctorId?.name || 'Unknown';
      byDoctor[doctorName] = (byDoctor[doctorName] || 0) + 1;

      const day = app.date.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    const reportData = {
      title: 'Appointments Report',
      period: { start: startDate, end: endDate },
      summary: {
        total,
        completed: byStatus.Completed || 0,
        cancelled: byStatus.Cancelled || 0,
        inProgress: byStatus['In Progress'] || 0,
        completionRate: total > 0 ? ((byStatus.Completed || 0) / total * 100).toFixed(1) : 0
      },
      byStatus,
      byDoctor,
      byDay,
      appointments: appointments.map(app => ({
        id: app._id,
        date: app.date,
        time: app.time,
        doctor: app.doctorId?.name,
        student: app.studentId?.name,
        type: app.type,
        status: app.status
      }))
    };

    return reportData;
  }

  static async generatePharmacyReport(params) {
    const { startDate, endDate, status } = params;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (status && status !== 'All') query.status = status;

    const orders = await Order.find(query)
      .populate('studentId', 'name')
      .sort({ createdAt: 1 });

    const totalOrders = orders.length;
    let totalRevenue = 0;
    const byStatus = {};
    const topMedicines = {};
    const dailyRevenue = {};

    orders.forEach(order => {
      if (order.status === 'Delivered') totalRevenue += order.total;

      byStatus[order.status] = (byStatus[order.status] || 0) + 1;

      const day = order.createdAt.toISOString().split('T')[0];
      if (!dailyRevenue[day]) dailyRevenue[day] = { orders: 0, revenue: 0 };
      dailyRevenue[day].orders++;
      if (order.status === 'Delivered') dailyRevenue[day].revenue += order.total;

      (order.items || []).forEach(item => {
        topMedicines[item.name] = (topMedicines[item.name] || 0) + (item.quantity || 0);
      });
    });

    const sortedMedicines = Object.entries(topMedicines)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, quantity]) => ({ name, quantity }));

    const reportData = {
      title: 'Pharmacy Report',
      period: { start: startDate, end: endDate },
      summary: {
        totalOrders,
        totalRevenue: formatCurrency(totalRevenue),
        averageOrderValue: totalOrders > 0 ? formatCurrency(totalRevenue / totalOrders) : '$0',
        completedOrders: byStatus.Delivered || 0,
        cancelledOrders: byStatus.Cancelled || 0
      },
      byStatus,
      dailyRevenue,
      topMedicines: sortedMedicines,
      orders: orders.map(order => ({
        id: order.orderId,
        date: order.createdAt,
        student: order.studentName,
        items: (order.items || []).length,
        total: formatCurrency(order.total),
        status: order.status
      }))
    };

    return reportData;
  }

  static async generateUserGrowthReport(params) {
    const { startDate, endDate } = params;
    const query = {};
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const users = await User.find(query).sort({ createdAt: 1 });

    const byRole = { student: 0, doctor: 0, pharmacist: 0, admin: 0 };
    const monthlyGrowth = {};
    const dailyGrowth = {};

    users.forEach(user => {
      byRole[user.role] = (byRole[user.role] || 0) + 1;

      const month = user.createdAt.toISOString().substring(0, 7);
      if (!monthlyGrowth[month]) monthlyGrowth[month] = { total: 0, students: 0, doctors: 0 };
      monthlyGrowth[month].total++;
      monthlyGrowth[month][user.role + 's'] = (monthlyGrowth[month][user.role + 's'] || 0) + 1;

      const day = user.createdAt.toISOString().split('T')[0];
      dailyGrowth[day] = (dailyGrowth[day] || 0) + 1;
    });

    const totalUsers = users.length;
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    const reportData = {
      title: 'User Growth Report',
      period: { start: startDate, end: endDate },
      summary: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(1) : 0,
        byRole
      },
      monthlyGrowth,
      dailyGrowth,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        isActive: user.isActive,
        isVerified: user.isVerified
      }))
    };

    return reportData;
  }

  static async generateFeedbackReport(params) {
    const { startDate, endDate, module } = params;
    const query = {};
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (module && module !== 'All') query.module = module;

    const feedbacks = await Feedback.find(query)
      .populate('userId', 'name role')
      .sort({ createdAt: 1 });

    const total = feedbacks.length;
    const averageRating = total > 0 ? feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / total : 0;

    const byModule = {};
    const byRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const bySentiment = { positive: 0, neutral: 0, negative: 0 };
    const monthlyTrend = {};

    feedbacks.forEach(f => {
      byModule[f.module] = (byModule[f.module] || 0) + 1;
      byRating[f.rating] = (byRating[f.rating] || 0) + 1;
      bySentiment[f.sentiment] = (bySentiment[f.sentiment] || 0) + 1;

      const month = f.createdAt.toISOString().substring(0, 7);
      if (!monthlyTrend[month]) monthlyTrend[month] = { count: 0, avgRating: 0, sum: 0 };
      monthlyTrend[month].count++;
      monthlyTrend[month].sum += f.rating || 0;
      monthlyTrend[month].avgRating = (monthlyTrend[month].sum / monthlyTrend[month].count).toFixed(1);
    });

    const reportData = {
      title: 'Feedback Report',
      period: { start: startDate, end: endDate },
      summary: {
        total,
        averageRating: averageRating.toFixed(1),
        positiveRate: total > 0 ? ((bySentiment.positive / total) * 100).toFixed(1) : '0.0',
        neutralRate: total > 0 ? ((bySentiment.neutral / total) * 100).toFixed(1) : '0.0',
        negativeRate: total > 0 ? ((bySentiment.negative / total) * 100).toFixed(1) : '0.0'
      },
      byModule,
      byRating,
      bySentiment,
      monthlyTrend,
      feedbacks: feedbacks.map(f => ({
        id: f._id,
        user: f.isAnonymous ? 'Anonymous' : f.userName,
        module: f.module,
        rating: f.rating,
        comment: f.comment,
        sentiment: f.sentiment,
        status: f.status,
        createdAt: f.createdAt
      }))
    };

    return reportData;
  }

  static async generateFinancialReport(params) {
    const { startDate, endDate } = params;
    const query = {};
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      query.status = 'Delivered';
    }

    const orders = await Order.find(query).sort({ createdAt: 1 });

    let totalRevenue = 0;
    const monthlyRevenue = {};
    const paymentMethodBreakdown = {};

    orders.forEach(order => {
      totalRevenue += order.total || 0;

      const month = order.createdAt.toISOString().substring(0, 7);
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (order.total || 0);

      paymentMethodBreakdown[order.paymentMethod] = (paymentMethodBreakdown[order.paymentMethod] || 0) + (order.total || 0);
    });

    const reportData = {
      title: 'Financial Report',
      period: { start: startDate, end: endDate },
      summary: {
        totalRevenue: formatCurrency(totalRevenue),
        totalOrders: orders.length,
        averageOrderValue: orders.length > 0 ? formatCurrency(totalRevenue / orders.length) : '$0'
      },
      monthlyRevenue,
      paymentMethodBreakdown,
      orders: orders.map(order => ({
        id: order.orderId,
        date: order.createdAt,
        student: order.studentName,
        total: formatCurrency(order.total),
        paymentMethod: order.paymentMethod,
        status: order.status
      }))
    };

    return reportData;
  }

  static async generateAndSaveReport(params) {
    const { type, startDate, endDate, userId, filters = {} } = params;
    let reportData;

    switch (type) {
      case 'appointments':
        reportData = await this.generateAppointmentReport({ startDate, endDate, ...filters });
        break;
      case 'pharmacy':
        reportData = await this.generatePharmacyReport({ startDate, endDate, ...filters });
        break;
      case 'users':
        reportData = await this.generateUserGrowthReport({ startDate, endDate });
        break;
      case 'feedback':
        reportData = await this.generateFeedbackReport({ startDate, endDate, ...filters });
        break;
      case 'financial':
        reportData = await this.generateFinancialReport({ startDate, endDate });
        break;
      default:
        throw new Error('Invalid report type');
    }

    const report = await Report.create({
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${formatDate(new Date(), 'short')}`,
      type,
      format: 'PDF',
      parameters: { dateRange: { start: startDate, end: endDate }, filters },
      status: 'Completed',
      generatedBy: userId,
      generatedAt: Date.now(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    return { report, data: reportData };
  }

  static async getSavedReports(userId, filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find({ generatedBy: userId })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .skip(skip),
      Report.countDocuments({ generatedBy: userId })
    ]);

    return {
      reports,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getReportById(reportId, userId) {
    const report = await Report.findOne({ _id: reportId, generatedBy: userId });
    if (!report) throw new Error('Report not found');
    return report;
  }
}

export default ReportService;
