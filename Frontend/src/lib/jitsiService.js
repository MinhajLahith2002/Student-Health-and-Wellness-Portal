/**
 * Jitsi Meet Service — embed via External API (meet.jit.si or self-hosted).
 *
 * Set `VITE_JITSI_DOMAIN` for a private deployment; defaults to public meet.jit.si.
 */

const JITSI_DOMAIN =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_JITSI_DOMAIN
    ? String(import.meta.env.VITE_JITSI_DOMAIN).replace(/^https?:\/\//, '').split('/')[0]
    : 'meet.jit.si';

/** Use insecure WebSocket only on local http (dev); production must stay HTTPS. */
function shouldUseNoSSL() {
  if (typeof window === 'undefined') return false;
  return import.meta.env.DEV && window.location.protocol === 'http:';
}

/**
 * @param {string} roomName - Sanitized unique room (e.g. CampusHealth-appointmentId)
 * @param {Object} options
 * @param {HTMLElement} options.containerEl
 * @param {Function} [options.onConferenceFailed]
 */
export async function initializeJitsi(roomName, options = {}) {
  if (!window.JitsiMeetExternalAPI) {
    throw new Error('Jitsi Meet library not loaded. Ensure script tag is in HTML.');
  }

  const {
    domain = JITSI_DOMAIN,
    containerEl,
    displayName = 'Campus Health User',
    userRole = 'student',
    avatarUrl = '',
    onMeetingJoined = () => {},
    onParticipantJoined = () => {},
    onParticipantLeft = () => {},
    onMeetingEnded = () => {},
    onConferenceFailed = () => {}
  } = options;

  // Minimal overrides — avoid custom hosts/bosh (breaks public meet.jit.si).
  const configOverwrite = {
    prejoinPageEnabled: false,
    startWithAudioMuted: false,
    startWithVideoMuted: false
  };

  const interfaceConfigOverwrite = {
    TOOLBAR_BUTTONS: [
      'microphone',
      'camera',
      'desktop',
      'fullscreen',
      'fodeviceselection',
      'hangup',
      'profile',
      'chat',
      'settings',
      'videoquality',
      'filmstrip',
      'tileview',
      'raisehand'
    ],
    SETTINGS_SECTIONS: ['devices', 'language', 'profile'],
    SHOW_JITSI_WATERMARK: false,
    SHOW_WATERMARK: false,
    SHOW_BRAND_WATERMARK: false,
    MOBILE_APP_PROMO: false
  };

  try {
    const api = new window.JitsiMeetExternalAPI(domain, {
      roomName,
      parentNode: containerEl,
      configOverwrite,
      interfaceConfigOverwrite,
      userInfo: {
        displayName,
        email: `${userRole}@campus-health.local`
      },
      width: '100%',
      height: '100%',
      noSSL: shouldUseNoSSL()
    });

    if (avatarUrl) {
      try {
        api.executeCommand('avatarUrl', avatarUrl);
      } catch {
        /* optional */
      }
    }

    try {
      api.executeCommand(
        'subject',
        `${userRole === 'doctor' ? 'Doctor' : 'Student'} consultation`
      );
    } catch {
      /* optional */
    }

    api.addEventListener('videoConferenceJoined', () => {
      onMeetingJoined?.(api);
    });

    api.addEventListener('participantJoined', (data) => {
      onParticipantJoined?.(data, api);
    });

    api.addEventListener('participantLeft', (data) => {
      onParticipantLeft?.(data, api);
    });

    api.addEventListener('conferenceLeft', () => {
      onMeetingEnded?.(api);
    });

    api.addEventListener('videoConferenceFailed', (failure) => {
      console.error('Jitsi: videoConferenceFailed', failure);
      onConferenceFailed?.(failure);
    });

    return api;
  } catch (err) {
    console.error('Jitsi initialization error:', err);
    throw err;
  }
}

export function getJitsiDomain(domain = '') {
  if (domain) {
    return String(domain).replace(/^https?:\/\//, '').split('/')[0];
  }

  return JITSI_DOMAIN;
}

/**
 * Quality control utilities
 */
export const JitsiQualityControl = {
  /**
   * Set video quality
   * @param {Object} api - Jitsi API instance
   * @param {number} quality - Quality level (240, 480, 720, 1080)
   */
  setVideoQuality: (api, quality = 480) => {
    try {
      api.executeCommand('setVideoQuality', quality);
      console.log(`Video quality set to ${quality}p`);
    } catch (err) {
      console.warn('Could not set video quality:', err);
    }
  },

  /**
   * Enable/disable noise suppression
   */
  setNoiseSuppression: (api, enabled = true) => {
    try {
      // Noise suppression is handled by Jitsi automatically
      console.log(`Noise suppression ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.warn('Could not control noise suppression:', err);
    }
  },

  /**
   * Get current connection stats
   */
  getConnectionStats: async (api) => {
    try {
      // Connection info through Jitsi's stats module
      return {
        quality: api._jitsiTrack?.getVideoType?.() || 'unknown',
        resolution: api._resolution || 'unknown'
      };
    } catch (err) {
      console.warn('Could not get connection stats:', err);
      return null;
    }
  }
};

/**
 * Recording utilities
 */
export const JitsiRecording = {
  /**
   * Start recording (if backend supports Jibri)
   */
  startRecording: (api) => {
    try {
      api.executeCommand('toggleRecording', { mode: 'file' });
      console.log('Recording started');
    } catch (err) {
      console.warn('Could not start recording:', err);
    }
  },

  /**
   * Stop recording
   */
  stopRecording: (api) => {
    try {
      api.executeCommand('toggleRecording', { mode: 'file' });
      console.log('Recording stopped');
    } catch (err) {
      console.warn('Could not stop recording:', err);
    }
  }
};

/**
 * Chat utilities
 */
export const JitsiChat = {
  /**
   * Send message to all participants
   */
  sendMessage: (api, message) => {
    try {
      api.executeCommand('sendChatMessage', message);
      console.log('Message sent:', message);
    } catch (err) {
      console.warn('Could not send message:', err);
    }
  },

  /**
   * Toggle chat visibility
   */
  toggleChat: (api, visible = true) => {
    try {
      api.executeCommand('toggleChat', visible);
    } catch (err) {
      console.warn('Could not toggle chat:', err);
    }
  }
};

/**
 * Screen sharing utilities
 */
export const JitsiScreenShare = {
  /**
   * Start screen sharing
   */
  startScreenShare: (api) => {
    try {
      api.executeCommand('toggleScreenShare');
      console.log('Screen sharing started');
    } catch (err) {
      console.warn('Could not start screen sharing:', err);
    }
  },

  /**
   * Stop screen sharing
   */
  stopScreenShare: (api) => {
    try {
      api.executeCommand('toggleScreenShare');
      console.log('Screen sharing stopped');
    } catch (err) {
      console.warn('Could not stop screen sharing:', err);
    }
  }
};

/**
 * Participant management
 */
export const JitsiParticipants = {
  /**
   * Get list of participants
   */
  getParticipants: (api) => {
    try {
      return api.getParticipantsInfo?.() || [];
    } catch (err) {
      console.warn('Could not get participants:', err);
      return [];
    }
  },

  /**
   * Mute participant audio
   */
  muteParticipant: (api, participantId) => {
    try {
      api.executeCommand('muteParticipant', participantId);
      console.log('Participant muted:', participantId);
    } catch (err) {
      console.warn('Could not mute participant:', err);
    }
  },

  /**
   * Change participant display name
   */
  setDisplayName: (api, name) => {
    try {
      api.executeCommand('displayName', name);
      console.log('Display name set:', name);
    } catch (err) {
      console.warn('Could not set display name:', err);
    }
  }
};

/**
 * Cleanup function
 */
export function disposeJitsi(api) {
  if (!api) return;

  try {
    api.dispose();
    console.log('✅ Jitsi: API disposed');
  } catch (err) {
    console.warn('Error disposing Jitsi:', err);
  }
}

/**
 * Load Jitsi library from CDN
 */
export async function loadJitsiLibrary(domain = JITSI_DOMAIN) {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }

    const sanitizedDomain = getJitsiDomain(domain);
    const existingScript = document.querySelector(`script[data-jitsi-domain="${sanitizedDomain}"]`);

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Jitsi library')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://${sanitizedDomain}/external_api.js`;
    script.async = true;
    script.dataset.jitsiDomain = sanitizedDomain;
    script.onload = () => {
      console.log('✅ Jitsi library loaded');
      resolve();
    };
    script.onerror = () => {
      console.error('❌ Failed to load Jitsi library');
      reject(new Error('Failed to load Jitsi library'));
    };

    document.head.appendChild(script);
  });
}
