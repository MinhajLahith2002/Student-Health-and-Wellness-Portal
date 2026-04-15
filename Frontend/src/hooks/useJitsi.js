import { useEffect, useState, useCallback, useRef } from 'react';
import {
  initializeJitsi,
  disposeJitsi,
  loadJitsiLibrary,
  JitsiQualityControl,
  JitsiParticipants,
  JitsiScreenShare
} from '../lib/jitsiService';

/**
 * useJitsi — Jitsi Meet lifecycle for consultation pages.
 *
 * - API instance is kept in a ref (no re-init from setState loops).
 * - Cleanup runs on unmount and when `appointmentId` changes.
 * - With `autoStart: false`, call `initialize()` once the container ref is mounted and data is ready.
 */
export function useJitsi(appointmentId, options = {}) {
  const {
    containerRef,
    roomName: roomNameOverride = '',
    domain: domainOverride = '',
    displayName = 'Campus Health User',
    userRole = 'student',
    avatarUrl = '',
    autoStart = true,
    videoQuality = 480
  } = options;

  const optsRef = useRef({ domainOverride, displayName, userRole, avatarUrl, videoQuality });
  optsRef.current = { domainOverride, displayName, userRole, avatarUrl, videoQuality };

  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const apiRef = useRef(null);
  const initInFlightRef = useRef(false);
  /** Bumped on dispose so late async `initialize` does not attach a stale API. */
  const generationRef = useRef(0);

  const roomName = roomNameOverride
    ? String(roomNameOverride).replace(/[^a-zA-Z0-9_-]/g, '')
    : appointmentId
      ? `CampusHealth-${String(appointmentId).replace(/[^a-zA-Z0-9_-]/g, '')}`
      : '';

  const disposeInternal = useCallback(() => {
    generationRef.current += 1;
    if (apiRef.current) {
      disposeJitsi(apiRef.current);
      apiRef.current = null;
    }
    initInFlightRef.current = false;
    setIsVideoReady(false);
    setParticipants([]);
    setIsScreenSharing(false);
  }, []);

  useEffect(() => {
    return () => {
      disposeInternal();
    };
  }, [appointmentId, disposeInternal]);

  const initialize = useCallback(async () => {
    const el = containerRef?.current;
    if (!el || !roomName) {
      console.warn('useJitsi: container ref or appointment id missing');
      return;
    }
    if (apiRef.current || initInFlightRef.current) return;

    initInFlightRef.current = true;
    const gen = generationRef.current;
    const o = optsRef.current;

    try {
      setIsInitializing(true);
      setError(null);

      await loadJitsiLibrary(o.domainOverride);
      if (gen !== generationRef.current) return;

      const api = await initializeJitsi(roomName, {
        domain: o.domainOverride,
        containerEl: el,
        displayName: o.displayName,
        userRole: o.userRole,
        avatarUrl: o.avatarUrl,
        onMeetingJoined: () => {
          setIsVideoReady(true);
          JitsiQualityControl.setVideoQuality(api, o.videoQuality ?? 480);
          setParticipants(JitsiParticipants.getParticipants(api));
        },
        onParticipantJoined: () => {
          setParticipants(JitsiParticipants.getParticipants(api));
        },
        onParticipantLeft: () => {
          setParticipants(JitsiParticipants.getParticipants(api));
        },
        onMeetingEnded: () => {
          setIsVideoReady(false);
          setParticipants([]);
        },
        onConferenceFailed: (failure) => {
          const msg =
            failure?.error?.message ||
            failure?.message ||
            (typeof failure === 'string' ? failure : 'Video conference failed');
          setError(msg);
          setIsVideoReady(false);
        }
      });

      if (gen !== generationRef.current) {
        disposeJitsi(api);
        return;
      }

      apiRef.current = api;

      const onShareToggled = (payload) => {
        if (payload && typeof payload.on === 'boolean') {
          setIsScreenSharing(payload.on);
        }
      };
      try {
        api.addEventListener?.('screenSharingStatusChanged', onShareToggled);
      } catch {
        /* older API shapes */
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to initialize Jitsi';
      console.error('useJitsi initialization error:', errorMsg);
      setError(errorMsg);
    } finally {
      initInFlightRef.current = false;
      setIsInitializing(false);
    }
  }, [roomName, containerRef]);

  useEffect(() => {
    if (!autoStart || !roomName) return undefined;

    const id = requestAnimationFrame(() => {
      void initialize();
    });
    return () => cancelAnimationFrame(id);
  }, [autoStart, roomName, initialize]);

  const toggleScreenShare = useCallback(async () => {
    if (!apiRef.current) {
      console.warn('Jitsi API not available');
      return;
    }
    try {
      JitsiScreenShare.startScreenShare(apiRef.current);
      setIsScreenSharing((prev) => !prev);
    } catch (err) {
      console.error('Screen share error:', err);
      setError('Failed to toggle screen sharing');
    }
  }, []);

  const setVideoQualityLevel = useCallback((quality) => {
    if (!apiRef.current) return;
    try {
      JitsiQualityControl.setVideoQuality(apiRef.current, quality);
    } catch (err) {
      console.error('Quality control error:', err);
    }
  }, []);

  const sendChatMessage = useCallback((message) => {
    if (!apiRef.current) return;
    try {
      apiRef.current.executeCommand('sendChatMessage', message);
    } catch (err) {
      console.error('Chat error:', err);
    }
  }, []);

  const getConnectionQuality = useCallback(() => {
    if (!apiRef.current) return null;
    try {
      return JitsiQualityControl.getConnectionStats(apiRef.current);
    } catch {
      return null;
    }
  }, []);

  const dispose = useCallback(() => {
    disposeInternal();
    setError(null);
  }, [disposeInternal]);

  return {
    jitsiApi: apiRef.current,
    isVideoReady,
    isScreenSharing,
    participants,
    error,
    isInitializing,
    initialize,
    toggleScreenShare,
    setVideoQuality: setVideoQualityLevel,
    sendChatMessage,
    getConnectionQuality,
    dispose
  };
}
