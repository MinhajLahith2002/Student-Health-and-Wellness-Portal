const COUNSELING_MODE_LABELS = {
  video: 'Video Call',
  in_person: 'In-Person',
  chat: 'Chat'
};

const LEGACY_MODE_TO_CANONICAL = {
  'video call': 'video',
  'video': 'video',
  'in-person': 'in_person',
  'in person': 'in_person',
  'in_person': 'in_person',
  'chat': 'chat'
};

function normalizeCounselingMode(value) {
  const normalized = `${value || ''}`.trim().toLowerCase();
  return LEGACY_MODE_TO_CANONICAL[normalized] || 'video';
}

function getCounselingModeLabel(value) {
  const normalized = normalizeCounselingMode(value);
  return COUNSELING_MODE_LABELS[normalized] || COUNSELING_MODE_LABELS.video;
}

function buildJitsiRoomName(sessionId) {
  return `campushealth-counseling-${sessionId}`;
}

function buildJitsiMeetingLink(sessionId) {
  return `https://meet.jit.si/${buildJitsiRoomName(sessionId)}`;
}

function buildJitsiEmbedLink(sessionId) {
  return `${buildJitsiMeetingLink(sessionId)}#config.prejoinPageEnabled=false&config.startWithAudioMuted=true`;
}

export {
  buildJitsiEmbedLink,
  buildJitsiMeetingLink,
  buildJitsiRoomName,
  getCounselingModeLabel,
  normalizeCounselingMode
};
