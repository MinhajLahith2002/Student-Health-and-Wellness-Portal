import { io } from 'socket.io-client';
import { getBackendOrigin } from './api';

let socketInstance = null;
let socketToken = '';

export function getAuthenticatedSocket(token) {
  if (!token) return null;

  if (socketInstance && socketToken === token) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
  }

  socketToken = token;
  socketInstance = io(getBackendOrigin(), {
    transports: ['websocket'],
    autoConnect: true,
    auth: { token }
  });

  return socketInstance;
}

export function initializeSocket(token) {
  return getAuthenticatedSocket(token);
}

export function getSocket() {
  return socketInstance;
}

export function isConnected() {
  return Boolean(socketInstance?.connected);
}

export function disconnectAuthenticatedSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    socketToken = '';
  }
}

export function disconnectSocket() {
  disconnectAuthenticatedSocket();
}

export function reconnectSocket(token) {
  disconnectSocket();
  return initializeSocket(token);
}

export function subscribeToAppointmentUpdates(appointmentId, callback) {
  if (!socketInstance || !appointmentId) return undefined;

  socketInstance.emit('appointment:subscribe', appointmentId);
  socketInstance.on(`appointment:${appointmentId}:updated`, callback);

  return () => {
    socketInstance?.emit('appointment:unsubscribe', appointmentId);
    socketInstance?.off(`appointment:${appointmentId}:updated`, callback);
  };
}

export function unsubscribeFromAppointmentUpdates(appointmentId) {
  if (!socketInstance || !appointmentId) return;

  socketInstance.emit('appointment:unsubscribe', appointmentId);
  socketInstance.off(`appointment:${appointmentId}:updated`);
}

export function subscribeToQueueUpdates(doctorId, callback) {
  if (!socketInstance || !doctorId) return undefined;

  socketInstance.emit('queue:subscribe', doctorId);
  socketInstance.on(`queue:${doctorId}:updated`, callback);

  return () => {
    socketInstance?.emit('queue:unsubscribe', doctorId);
    socketInstance?.off(`queue:${doctorId}:updated`, callback);
  };
}

export function unsubscribeFromQueueUpdates(doctorId) {
  if (!socketInstance || !doctorId) return;

  socketInstance.emit('queue:unsubscribe', doctorId);
  socketInstance.off(`queue:${doctorId}:updated`);
}

function subscribeToAppointmentUpdateMatch(appointmentId, predicate, callback) {
  if (!socketInstance || !appointmentId) return undefined;

  const handler = (payload) => {
    if (predicate(payload)) {
      callback(payload);
    }
  };

  socketInstance.on(`appointment:${appointmentId}:updated`, handler);

  return () => {
    socketInstance?.off(`appointment:${appointmentId}:updated`, handler);
  };
}

export function onAppointmentReady(appointmentId, callback) {
  return subscribeToAppointmentUpdateMatch(
    appointmentId,
    (payload) => payload?.status === 'In Progress' || Boolean(payload?.startedAt),
    callback
  );
}

export function onAppointmentStarted(appointmentId, callback) {
  return subscribeToAppointmentUpdateMatch(
    appointmentId,
    (payload) => payload?.status === 'In Progress' || Boolean(payload?.startedAt),
    callback
  );
}

export function onPrescriptionCreated(appointmentId, callback) {
  return subscribeToAppointmentUpdateMatch(
    appointmentId,
    (payload) => Boolean(payload?.prescriptionId),
    callback
  );
}

export function onNotification(callback) {
  if (!socketInstance) return undefined;
  socketInstance.on('notification:new', callback);
  return () => socketInstance?.off('notification:new', callback);
}

export function onAvailabilityUpdated(callback) {
  if (!socketInstance) return undefined;
  socketInstance.on('availability:updated', callback);
  return () => socketInstance?.off('availability:updated', callback);
}

export function onCounselingSessionUpdated(callback) {
  if (!socketInstance) return undefined;
  socketInstance.on('counseling:session-updated', callback);
  return () => socketInstance?.off('counseling:session-updated', callback);
}

export function onQueuePositionUpdate(appointmentId, callback) {
  if (!socketInstance || !appointmentId) return undefined;
  socketInstance.on(`queue:${appointmentId}:position`, callback);
  return () => socketInstance?.off(`queue:${appointmentId}:position`, callback);
}

export function emitCheckIn(appointmentId) {
  socketInstance?.emit('appointment:check-in', appointmentId);
}

export function emitDoctorReady(appointmentId) {
  socketInstance?.emit('appointment:doctor-ready', appointmentId);
}

export function emitConsultationStarted(appointmentId) {
  socketInstance?.emit('appointment:consultation-started', appointmentId);
}

export function emitPrescriptionCreated(appointmentId, prescription) {
  socketInstance?.emit('prescription:created', { appointmentId, prescription });
}

export function sendChatMessage(appointmentId, message) {
  socketInstance?.emit('chat:send', { appointmentId, message });
}

export function onChatMessage(appointmentId, callback) {
  if (!socketInstance || !appointmentId) return undefined;
  socketInstance.on(`chat:${appointmentId}:message`, callback);
  return () => socketInstance?.off(`chat:${appointmentId}:message`, callback);
}

export default {
  getAuthenticatedSocket,
  disconnectAuthenticatedSocket,
  initializeSocket,
  getSocket,
  isConnected,
  disconnectSocket,
  reconnectSocket,
  subscribeToAppointmentUpdates,
  unsubscribeFromAppointmentUpdates,
  subscribeToQueueUpdates,
  unsubscribeFromQueueUpdates,
  onAppointmentReady,
  onAppointmentStarted,
  onPrescriptionCreated,
  onNotification,
  onAvailabilityUpdated,
  onCounselingSessionUpdated,
  onQueuePositionUpdate,
  emitCheckIn,
  emitDoctorReady,
  emitConsultationStarted,
  emitPrescriptionCreated,
  sendChatMessage,
  onChatMessage,
};
