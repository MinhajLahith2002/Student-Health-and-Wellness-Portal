// notificationService.js

import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/emailService.js';
import { emitToUser, broadcastSystemNotification } from '../utils/socket.js';

class NotificationService {
  static async getUserNotifications(userId, filters = {}) {
    const { page = 1, limit = 20, unreadOnly = false } = filters;
    const query = { recipients: userId };

    if (unreadOnly === 'true') {
      query['readBy.user'] = { $ne: userId };
    }

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      Notification.countDocuments(query),
      Notification.countDocuments({
        recipients: userId,
        'readBy.user': { $ne: userId }
      })
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findById(notificationId);
    if (!notification) throw new Error('Notification not found');

    const alreadyRead = notification.readBy.some(r => r.user.toString() === userId);
    if (!alreadyRead) {
      notification.readBy.push({ user: userId, readAt: Date.now() });
      await notification.save();
    }

    return notification;
  }

  static async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { recipients: userId, 'readBy.user': { $ne: userId } },
      { $push: { readBy: { user: userId, readAt: Date.now() } } }
    );
    return result.modifiedCount;
  }

  static async createNotification(data, createdBy) {
    const { title, message, type, target, targetRole, scheduledFor, link } = data;
    let targetUsers = [];

    if (target === 'All Users') {
      const users = await User.find({ isActive: true });
      targetUsers = users.map(u => u._id);
    } else if (target === 'All Students') {
      const students = await User.find({ role: 'student', isActive: true });
      targetUsers = students.map(u => u._id);
    } else if (target === 'All Doctors') {
      const doctors = await User.find({ role: 'doctor', isActive: true });
      targetUsers = doctors.map(u => u._id);
    } else if (target === 'All Staff') {
      const staff = await User.find({ role: { $in: ['doctor', 'pharmacist', 'admin'] }, isActive: true });
      targetUsers = staff.map(u => u._id);
    } else if (target === 'Specific Role' && targetRole) {
      const users = await User.find({ role: targetRole, isActive: true });
      targetUsers = users.map(u => u._id);
    }

    const notification = await Notification.create({
      title,
      message,
      type,
      target,
      targetRole,
      targetUsers,
      recipients: targetUsers,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      link,
      createdBy,
      status: scheduledFor ? 'Scheduled' : 'Sent',
      sentAt: scheduledFor ? null : Date.now()
    });

    if (!scheduledFor) {
      for (const userId of targetUsers) {
        emitToUser(userId, 'new-notification', {
          id: notification._id,
          title,
          message,
          type,
          link
        });
      }
    }

    return notification;
  }

  static async sendAppointmentNotification(appointment, recipientId, action) {
    const titles = {
      created: 'New Appointment',
      updated: 'Appointment Updated',
      cancelled: 'Appointment Cancelled'
    };

    const messages = {
      created: `New appointment scheduled for ${appointment.date.toLocaleDateString()} at ${appointment.time}`,
      updated: `Your appointment has been updated to ${appointment.date.toLocaleDateString()} at ${appointment.time}`,
      cancelled: `Your appointment scheduled for ${appointment.date.toLocaleDateString()} at ${appointment.time} has been cancelled`
    };

    const notification = await Notification.create({
      title: titles[action],
      message: messages[action],
      type: 'appointment',
      target: 'Specific User',
      targetUsers: [recipientId],
      recipients: [recipientId],
      link: `/appointments/${appointment._id}`,
      createdBy: appointment.doctorId || appointment.studentId,
      status: 'Sent',
      sentAt: Date.now()
    });

    emitToUser(recipientId, 'new-notification', {
      id: notification._id,
      title: titles[action],
      message: messages[action],
      type: 'appointment',
      link: `/appointments/${appointment._id}`
    });

    return notification;
  }

  static async sendOrderNotification(order, recipientId, action) {
    const titles = {
      created: 'Order Confirmed',
      updated: 'Order Status Updated',
      delivered: 'Order Delivered'
    };

    const messages = {
      created: `Your order #${order.orderId} has been confirmed and is being processed`,
      updated: `Your order #${order.orderId} status has been updated to ${order.status}`,
      delivered: `Your order #${order.orderId} has been delivered`
    };

    const notification = await Notification.create({
      title: titles[action],
      message: messages[action],
      type: 'order',
      target: 'Specific User',
      targetUsers: [recipientId],
      recipients: [recipientId],
      link: `/orders/${order._id}`,
      createdBy: order.studentId,
      status: 'Sent',
      sentAt: Date.now()
    });

    emitToUser(recipientId, 'new-notification', {
      id: notification._id,
      title: titles[action],
      message: messages[action],
      type: 'order',
      link: `/orders/${order._id}`
    });

    return notification;
  }

  static async sendPrescriptionNotification(prescription, recipientId, action) {
    const titles = {
      created: 'New Prescription',
      verified: 'Prescription Verified',
      rejected: 'Prescription Rejected'
    };

    const messages = {
      created: `Dr. ${prescription.doctorName} has issued a prescription for you`,
      verified: `Your prescription has been verified and is ready for pickup`,
      rejected: `Your prescription was rejected. Reason: ${prescription.rejectionReason || 'Please contact support'}`
    };

    const notification = await Notification.create({
      title: titles[action],
      message: messages[action],
      type: 'prescription',
      target: 'Specific User',
      targetUsers: [recipientId],
      recipients: [recipientId],
      link: `/prescriptions/${prescription._id}`,
      createdBy: prescription.doctorId,
      status: 'Sent',
      sentAt: Date.now()
    });

    emitToUser(recipientId, 'new-notification', {
      id: notification._id,
      title: titles[action],
      message: messages[action],
      type: 'prescription',
      link: `/prescriptions/${prescription._id}`
    });

    return notification;
  }

  static async sendBroadcast(data, createdBy) {
    const { title, message, type, target, targetRole, scheduledFor } = data;
    let targetUsers = [];

    if (target === 'All Users') {
      const users = await User.find({ isActive: true });
      targetUsers = users.map(u => u._id);
    } else if (target === 'All Students') {
      const students = await User.find({ role: 'student', isActive: true });
      targetUsers = students.map(u => u._id);
    } else if (target === 'All Doctors') {
      const doctors = await User.find({ role: 'doctor', isActive: true });
      targetUsers = doctors.map(u => u._id);
    } else if (target === 'Specific Role' && targetRole) {
      const users = await User.find({ role: targetRole, isActive: true });
      targetUsers = users.map(u => u._id);
    }

    const notification = await Notification.create({
      title,
      message,
      type,
      target,
      targetRole,
      targetUsers,
      recipients: targetUsers,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      createdBy,
      status: scheduledFor ? 'Scheduled' : 'Sent',
      sentAt: scheduledFor ? null : Date.now()
    });

    if (type === 'alert' || type === 'system') {
      const users = await User.find({ _id: { $in: targetUsers } }, 'email');
      for (const user of users) {
        await sendEmail({
          to: user.email,
          subject: `[CampusHealth] ${title}`,
          html: `<p>${message}</p>`
        });
      }
    }

    if (!scheduledFor) {
      for (const userId of targetUsers) {
        emitToUser(userId, 'new-notification', {
          id: notification._id,
          title,
          message,
          type
        });
      }
    }

    return notification;
  }

  static async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      createdBy: userId
    });

    if (!notification) {
      throw new Error('Notification not found or unauthorized');
    }

    return notification;
  }

  static async processScheduledNotifications() {
    const now = new Date();

    const notifications = await Notification.find({
      status: 'Scheduled',
      scheduledFor: { $lte: now }
    });

    let processed = 0;

    for (const notification of notifications) {
      notification.status = 'Sent';
      notification.sentAt = now;
      await notification.save();

      for (const userId of notification.recipients) {
        emitToUser(userId, 'new-notification', {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          link: notification.link
        });
      }

      processed++;
    }

    return processed;
  }
}

export default NotificationService;
