/**
 * Hook: useSocket
 * Provides real-time socket functionality for React components
 * Handles connection, subscriptions, and cleanup
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import {
  initializeSocket,
  isConnected,
  subscribeToAppointmentUpdates,
  unsubscribeFromAppointmentUpdates,
  subscribeToQueueUpdates,
  unsubscribeFromQueueUpdates,
  onAppointmentReady,
  onAppointmentStarted,
  onPrescriptionCreated,
  onNotification,
  onAvailabilityUpdated,
  onQueuePositionUpdate,
  emitCheckIn,
  emitDoctorReady,
  emitConsultationStarted,
  emitPrescriptionCreated,
  sendChatMessage,
  onChatMessage,
  disconnectSocket
} from '../lib/socket';

/**
 * Hook: useSocket
 * Connects to WebSocket server and provides real-time functionality
 *
 * Usage:
 * const { connected, notifications, subscribeAppointment, emitEvent } = useSocket();
 */
export function useSocket() {
  const { token, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [queuePosition, setQueuePosition] = useState(null);
  const realtimeCacheRef = useRef(new Map());

  const shouldProcessEvent = useCallback((key, ttlMs = 2500) => {
    if (!key) return true;

    const now = Date.now();
    const cache = realtimeCacheRef.current;
    const previousTimestamp = cache.get(key);

    if (previousTimestamp && now - previousTimestamp < ttlMs) {
      return false;
    }

    cache.set(key, now);

    // Keep the dedupe cache bounded during long-lived sessions.
    for (const [cachedKey, timestamp] of cache.entries()) {
      if (now - timestamp > ttlMs * 4) {
        cache.delete(cachedKey);
      }
    }

    return true;
  }, []);

  // Initialize socket on auth.
  useEffect(() => {
    if (!isAuthenticated || !token) return undefined;

    initializeSocket(token);

    const removeNotificationListener = onNotification((notification) => {
      const notificationKey = [
        notification.id,
        notification.title,
        notification.message,
        notification.link
      ].filter(Boolean).join('|');

      if (!shouldProcessEvent(`notification:${notificationKey}`, 4000)) {
        return;
      }

      console.log('New notification:', notification);
      setNotifications((prev) => [...prev, notification]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
      }, 5000);
    });

    const initialConnectionCheck = setTimeout(() => {
      setConnected(isConnected());
    }, 0);

    const checkConnection = setInterval(() => {
      setConnected(isConnected());
    }, 1000);

    return () => {
      clearTimeout(initialConnectionCheck);
      clearInterval(checkConnection);
      removeNotificationListener?.();
    };
  }, [isAuthenticated, token, shouldProcessEvent]);

  /**
   * Subscribe to appointment updates
   */
  const subscribeAppointment = useCallback((appointmentId, callback) => {
    return subscribeToAppointmentUpdates(appointmentId, (updated) => {
      const updateKey = [
        appointmentId,
        updated.status,
        updated.checkInAt,
        updated.startedAt,
        updated.completedAt,
        updated.consultationNotes,
        updated.diagnosis
      ].filter((value) => value !== undefined && value !== null && value !== '').join('|');

      if (!shouldProcessEvent(`appointment:${updateKey}`)) {
        return;
      }

      console.log('Appointment updated:', updated);
      callback(updated);
    });
  }, [shouldProcessEvent]);

  /**
   * Unsubscribe from appointment updates
   */
  const unsubscribeAppointment = useCallback((appointmentId) => {
    unsubscribeFromAppointmentUpdates(appointmentId);
  }, []);

  /**
   * Subscribe to queue updates (doctor perspective)
   */
  const subscribeQueue = useCallback((doctorId, callback) => {
    return subscribeToQueueUpdates(doctorId, (queue) => {
      const queueKey = [
        doctorId,
        queue.type,
        queue.appointmentId,
        queue.status,
        queue.totalInQueue
      ].filter((value) => value !== undefined && value !== null && value !== '').join('|');

      if (!shouldProcessEvent(`queue:${queueKey}`)) {
        return;
      }

      console.log('Queue updated:', queue);
      callback(queue);
    });
  }, [shouldProcessEvent]);

  /**
   * Unsubscribe from queue
   */
  const unsubscribeQueue = useCallback((doctorId) => {
    unsubscribeFromQueueUpdates(doctorId);
  }, []);

  /**
   * Listen when doctor marks ready
   */
  const listenForDoctorReady = useCallback((appointmentId, callback) => {
    return onAppointmentReady(appointmentId, () => {
      console.log('Doctor is ready for appointment:', appointmentId);
      callback();
    });
  }, []);

  /**
   * Listen when consultation starts
   */
  const listenForConsultationStart = useCallback((appointmentId, callback) => {
    return onAppointmentStarted(appointmentId, () => {
      console.log('Consultation started:', appointmentId);
      callback();
    });
  }, []);

  /**
   * Listen for prescription created
   */
  const listenForPrescription = useCallback((appointmentId, callback) => {
    return onPrescriptionCreated(appointmentId, (prescription) => {
      console.log('Prescription created:', prescription);
      callback(prescription);
    });
  }, []);

  const listenForAvailabilityUpdates = useCallback((callback) => {
    return onAvailabilityUpdated((payload) => {
      const availabilityKey = [
        payload.source,
        payload.action,
        payload.providerId,
        payload.availabilityId,
        payload.appointmentId,
        payload.status,
        payload.date
      ].filter((value) => value !== undefined && value !== null && value !== '').join('|');

      if (!shouldProcessEvent(`availability:${availabilityKey}`, 3000)) {
        return;
      }

      console.log('Availability updated:', payload);
      callback(payload);
    });
  }, [shouldProcessEvent]);

  /**
   * Listen for queue position updates (for student in queue)
   */
  const listenForQueuePosition = useCallback((appointmentId, callback) => {
    return onQueuePositionUpdate(appointmentId, (position) => {
      const positionKey = [
        appointmentId,
        position.queuePosition,
        position.totalInQueue,
        position.estimatedWait,
        position.status
      ].filter((value) => value !== undefined && value !== null && value !== '').join('|');

      if (!shouldProcessEvent(`queue-position:${positionKey}`)) {
        return;
      }

      console.log('Queue position:', position);
      setQueuePosition(position);
      callback(position);
    });
  }, [shouldProcessEvent]);

  /**
   * Emit check-in event
   */
  const checkIn = useCallback((appointmentId) => {
    console.log('Emitting check-in for appointment:', appointmentId);
    emitCheckIn(appointmentId);
  }, []);

  /**
   * Emit doctor ready
   */
  const markDoctorReady = useCallback((appointmentId) => {
    console.log('Marking doctor ready for appointment:', appointmentId);
    emitDoctorReady(appointmentId);
  }, []);

  /**
   * Emit consultation started
   */
  const startConsultation = useCallback((appointmentId) => {
    console.log('Starting consultation:', appointmentId);
    emitConsultationStarted(appointmentId);
  }, []);

  /**
   * Emit prescription created
   */
  const createPrescription = useCallback((appointmentId, prescription) => {
    console.log('Emitting prescription created:', appointmentId);
    emitPrescriptionCreated(appointmentId, prescription);
  }, []);

  /**
   * Send chat message
   */
  const sendMessage = useCallback((appointmentId, message) => {
    console.log('Sending message in appointment:', appointmentId);
    sendChatMessage(appointmentId, message);
  }, []);

  /**
   * Listen for chat messages
   */
  const listenForMessages = useCallback((appointmentId, callback) => {
    return onChatMessage(appointmentId, (message) => {
      console.log('Message received:', message);
      callback(message);
    });
  }, []);

  /**
   * Disconnect socket (when logging out)
   */
  const disconnect = useCallback(() => {
    console.log('Disconnecting socket');
    disconnectSocket();
    setConnected(false);
  }, []);

  return {
    connected,
    notifications,
    queuePosition,
    subscribeAppointment,
    unsubscribeAppointment,
    subscribeQueue,
    unsubscribeQueue,
    listenForDoctorReady,
    listenForConsultationStart,
    listenForPrescription,
    listenForAvailabilityUpdates,
    listenForQueuePosition,
    listenForMessages,
    checkIn,
    markDoctorReady,
    startConsultation,
    createPrescription,
    sendMessage,
    disconnect
  };
}

export default useSocket;
