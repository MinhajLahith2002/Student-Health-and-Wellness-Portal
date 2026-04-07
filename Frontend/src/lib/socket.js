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

export function disconnectAuthenticatedSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    socketToken = '';
  }
}
