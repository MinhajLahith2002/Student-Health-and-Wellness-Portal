import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileText, MapPin, Save, Video } from 'lucide-react';
import {
  getCachedCounselingSessionById,
  getCounselingSessionById,
  updateCounselingSessionNotes,
  updateCounselingSessionStatus
} from '../../lib/counseling';
import { getCachedMentalHealthResources, getMentalHealthResources } from '../../lib/mentalHealth';
import CounselingSessionChatPanel from '../../components/mental-health/CounselingSessionChatPanel';
import DismissibleBanner from '../../components/DismissibleBanner';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { getResourceTypePresentation } from '../../lib/resourcePresentation';

const summaryTemplates = [
  'We named the main stressors, agreed on one realistic recovery step, and identified a coping routine for the next few days.',
  'The session focused on emotional regulation, sleep protection, and one support check-in before the next follow-up.',
  'We discussed academic strain, immediate grounding tools, and a short action plan the student can revisit this week.'
];

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMinimumFollowUpDate(sessionDate) {
  const today = getLocalDateValue();
  if (!sessionDate) return today;

  const sessionValue = getLocalDateValue(new Date(sessionDate));
  return sessionValue > today ? sessionValue : today;
}

function validateCounselorField(field, values, minimumFollowUpDate) {
  const confidentialLength = `${values.confidentialNotes || ''}`.trim().length;
  const summaryLength = `${values.sharedSummary || ''}`.trim().length;
  const actionPlanLength = `${values.actionPlan || ''}`.trim().length;
  const resourceMessageLength = `${values.assignedResourceMessage || ''}`.trim().length;

  switch (field) {
    case 'confidentialNotes':
      if (confidentialLength > 0 && confidentialLength < 10) {
        return 'Private notes should be at least 10 characters when provided.';
      }
      if (confidentialLength > 2500) {
        return 'Private notes cannot exceed 2500 characters.';
      }
      return '';
    case 'sharedSummary':
      if (!summaryLength) {
        return 'Student-visible summary is required.';
      }
      if (summaryLength < 20) {
        return 'Student-visible summary should be at least 20 characters.';
      }
      if (summaryLength > 1200) {
        return 'Student-visible summary cannot exceed 1200 characters.';
      }
      return '';
    case 'actionPlan':
      if (actionPlanLength > 0 && actionPlanLength < 10) {
        return 'Action plan should be at least 10 characters when provided.';
      }
      if (actionPlanLength > 1200) {
        return 'Action plan cannot exceed 1200 characters.';
      }
      return '';
    case 'assignedResourceMessage':
      if (resourceMessageLength > 0 && resourceMessageLength < 8) {
        return 'Assigned resource note should be at least 8 characters when provided.';
      }
      if (resourceMessageLength > 500) {
        return 'Assigned resource note cannot exceed 500 characters.';
      }
      return '';
    case 'selectedResources':
      return '';
    case 'followUpDate':
      if (!values.followUpRecommended) return '';
      if (!values.followUpDate) {
        return 'Choose a follow-up date before saving the recommendation.';
      }
      if (values.followUpDate < minimumFollowUpDate) {
        return `Follow-up date must be on or after ${minimumFollowUpDate}.`;
      }
      return '';
    default:
      return '';
  }
}

function validateCounselorForm(values, minimumFollowUpDate) {
  return {
    confidentialNotes: validateCounselorField('confidentialNotes', values, minimumFollowUpDate),
    sharedSummary: validateCounselorField('sharedSummary', values, minimumFollowUpDate),
    actionPlan: validateCounselorField('actionPlan', values, minimumFollowUpDate),
    assignedResourceMessage: validateCounselorField('assignedResourceMessage', values, minimumFollowUpDate),
    selectedResources: validateCounselorField('selectedResources', values, minimumFollowUpDate),
    followUpDate: validateCounselorField('followUpDate', values, minimumFollowUpDate)
  };
}

function normalizeAssignedResourceIds(entries = []) {
  return entries
    .map((entry) => {
      if (!entry) return '';
      if (typeof entry === 'string') return entry;
      return entry._id || entry.id || '';
    })
    .filter(Boolean)
    .sort();
}

function buildCounselorNotesPayload(values) {
  return {
    confidentialNotes: values.confidentialNotes.trim(),
    sharedSummary: values.sharedSummary.trim(),
    actionPlan: values.actionPlan.trim(),
    assignedResources: normalizeAssignedResourceIds(values.selectedResources),
    assignedResourceMessage: values.assignedResourceMessage.trim(),
    followUpRecommended: Boolean(values.followUpRecommended),
    followUpDate: values.followUpRecommended ? values.followUpDate || null : null
  };
}

function hasPendingCounselorNoteChanges(session, values) {
  if (!session) return false;

  const payload = buildCounselorNotesPayload(values);
  const savedAssignedResources = normalizeAssignedResourceIds(session.assignedResources);

  return (
    `${session.confidentialNotes || ''}`.trim() !== payload.confidentialNotes
    || `${session.sharedSummary || ''}`.trim() !== payload.sharedSummary
    || `${session.actionPlan || ''}`.trim() !== payload.actionPlan
    || `${session.assignedResourceMessage || ''}`.trim() !== payload.assignedResourceMessage
    || Boolean(session.followUpRecommended) !== payload.followUpRecommended
    || (session.followUpDate ? getLocalDateValue(new Date(session.followUpDate)) : null) !== payload.followUpDate
    || JSON.stringify(savedAssignedResources) !== JSON.stringify(payload.assignedResources)
  );
}

export default function CounselingSessionPage() {
  const { sessionId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const cachedSession = getCachedCounselingSessionById(sessionId);
  const cachedResources = getCachedMentalHealthResources({ limit: 20 });
  const [session, setSession] = useState(cachedSession);
  const [resources, setResources] = useState(() => (
    user?.role === 'counselor' && Array.isArray(cachedResources) ? cachedResources : []
  ));
  const [confidentialNotes, setConfidentialNotes] = useState('');
  const [sharedSummary, setSharedSummary] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [assignedResourceMessage, setAssignedResourceMessage] = useState('');
  const [followUpRecommended, setFollowUpRecommended] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [selectedResources, setSelectedResources] = useState([]);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [noteErrors, setNoteErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');

  const isCounselor = user?.role === 'counselor';
  const canManageCounselorDocumentation = isCounselor && ['In Progress', 'Completed'].includes(session?.status);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const sessionPromise = getCounselingSessionById(sessionId);
        const resourcePromise = user?.role === 'counselor'
          ? getMentalHealthResources({ limit: 20 })
          : Promise.resolve([]);
        const [sessionData, resourceList] = await Promise.all([sessionPromise, resourcePromise]);

        if (!active) return;
        setSession(sessionData);
        if (user?.role === 'counselor') {
          setResources(Array.isArray(resourceList) ? resourceList : []);
        }
        setConfidentialNotes(sessionData.confidentialNotes || '');
        setSharedSummary(sessionData.sharedSummary || '');
        setActionPlan(sessionData.actionPlan || '');
        setAssignedResourceMessage(sessionData.assignedResourceMessage || '');
        setFollowUpRecommended(Boolean(sessionData.followUpRecommended));
        setFollowUpDate(sessionData.followUpDate ? getLocalDateValue(new Date(sessionData.followUpDate)) : '');
        setSelectedResources(Array.isArray(sessionData.assignedResources) ? sessionData.assignedResources.map((entry) => entry._id || entry) : []);
        setNoteErrors({});
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load counseling session');
      }
    })();

    return () => {
      active = false;
    };
  }, [sessionId, user?.role]);

  const minimumFollowUpDate = useMemo(() => getMinimumFollowUpDate(session?.date), [session?.date]);

  const noteFormValues = useMemo(() => ({
    confidentialNotes,
    sharedSummary,
    actionPlan,
    assignedResourceMessage,
    followUpRecommended,
    followUpDate,
    selectedResources
  }), [
    actionPlan,
    assignedResourceMessage,
    confidentialNotes,
    followUpDate,
    followUpRecommended,
    selectedResources,
    sharedSummary
  ]);

  function updateNoteField(field, value) {
    const nextValues = { ...noteFormValues, [field]: value };
    setNoteErrors((current) => ({
      ...current,
      [field]: validateCounselorField(field, nextValues, minimumFollowUpDate),
      ...(field === 'followUpRecommended' || field === 'followUpDate'
        ? { followUpDate: validateCounselorField('followUpDate', nextValues, minimumFollowUpDate) }
        : {})
    }));
    setError('');
  }

  async function handleSaveNotes() {
    const nextErrors = validateCounselorForm(noteFormValues, minimumFollowUpDate);
    setNoteErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setError('Please fix the highlighted counseling note fields before saving.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setStatusMessage('');
      const updated = await updateCounselingSessionNotes(sessionId, buildCounselorNotesPayload(noteFormValues));

      setSession(updated);
      setStatusMessage('Counselor notes saved successfully.');
    } catch (err) {
      setError(err.message || 'Failed to save counselor notes');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusUpdate(status) {
    if (!session || session.status === status || updatingStatus) return;

    let baseSession = session;

    try {
      setUpdatingStatus(true);
      setPendingStatus(status);
      setError('');
      setStatusMessage('');

      if (isCounselor && status === 'Completed') {
        const nextErrors = validateCounselorForm(noteFormValues, minimumFollowUpDate);
        setNoteErrors(nextErrors);

        if (Object.values(nextErrors).some(Boolean)) {
          setError('Save valid counseling notes and follow-up details before marking the session completed.');
          return;
        }

        if (hasPendingCounselorNoteChanges(session, noteFormValues)) {
          const notesUpdatedSession = await updateCounselingSessionNotes(sessionId, buildCounselorNotesPayload(noteFormValues));
          setSession(notesUpdatedSession);
          baseSession = notesUpdatedSession;
          setStatusMessage('Counselor notes saved. Completing session...');
        }
      }

      setSession((current) => (current ? { ...current, status } : current));
      const updated = await updateCounselingSessionStatus(sessionId, { status });
      setSession(updated);
      setStatusMessage(`Session updated to ${status}.`);
    } catch (err) {
      setSession(baseSession);
      setError(err.message || 'Failed to update session status');
    } finally {
      setPendingStatus('');
      setUpdatingStatus(false);
    }
  }

  if (!session) {
    return <div className="pharmacy-shell pt-36 px-6"><div className="max-w-6xl mx-auto pharmacy-panel p-8 text-secondary-text">{error || 'Loading counseling session...'}</div></div>;
  }

  return (
    <div className={`pharmacy-shell ${isCounselor ? 'pt-4' : 'pt-36'} pb-16 px-6`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid gap-8 xl:grid-cols-[1.15fr,0.85fr]">
        <section className="pharmacy-panel p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <span className="pharmacy-pill bg-sky-50 text-sky-700">{session.status}</span>
            {isCounselor ? (
              <button
                type="button"
                onClick={() => navigate('/counselor/sessions')}
                className="pharmacy-secondary self-start sm:shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to counselor workspace
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/mental-health/sessions')}
                className="pharmacy-secondary self-start sm:shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to My Counseling Sessions
              </button>
            )}
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-primary-text">
            {isCounselor ? session.studentName : session.counselorName}
          </h1>
          <p className="mt-3 text-secondary-text">
            {new Date(session.date).toLocaleDateString()} • {session.time} • {session.typeLabel}
          </p>

          <div className="mt-6 rounded-[1.5rem] bg-secondary-bg/80 p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Session reason</p>
            <p className="mt-3 text-sm leading-6 text-secondary-text">{session.reason}</p>
          </div>

          {session.status === 'Cancelled' && (
            <div className="mt-6 rounded-[1.5rem] border border-rose-100 bg-rose-50/90 p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose-700">Session cancelled</p>
              <p className="mt-3 text-sm leading-6 text-secondary-text">
                This counseling session is marked as cancelled and is no longer active.
              </p>
              {session.cancellationReason && (
                <p className="mt-3 text-sm leading-6 text-secondary-text">
                  Reason: {session.cancellationReason}
                </p>
              )}
            </div>
          )}

          {session.mode === 'video' && session.meetingLink && session.allowedActions?.canJoin && (
            <div className="mt-8 space-y-4">
              <div className="flex flex-wrap gap-3">
                <a href={session.meetingLink} target="_blank" rel="noreferrer" className="pharmacy-primary">
                  <Video className="w-4 h-4" />
                  Open Jitsi Room
                </a>
                <a href={session.meetingLink} target="_blank" rel="noreferrer" className="pharmacy-secondary">
                  <ExternalLink className="w-4 h-4" />
                  Open In New Tab
                </a>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/80">
                <iframe
                  title="Counseling video session"
                  src={session.meetingEmbedUrl || session.meetingLink}
                  className="h-[420px] w-full"
                  allow="camera; microphone; fullscreen; display-capture"
                />
              </div>
            </div>
          )}

          {session.mode === 'video' && session.meetingLink && !session.allowedActions?.canJoin && (
            <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white/80 px-5 py-4 text-sm text-secondary-text">
              This Jitsi room is no longer active because the session is {session.status.toLowerCase()}.
            </div>
          )}

          {session.mode === 'chat' && (
            <div className="mt-8">
              <CounselingSessionChatPanel
                sessionId={session._id}
                currentUser={user}
                token={token}
                sessionStatus={session.status}
                canJoin={session.allowedActions?.canJoin}
              />
            </div>
          )}

          {session.mode === 'in_person' && (
            <div className="mt-8 rounded-[1.75rem] border border-[#d7e4ea] bg-white/80 p-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-accent-primary" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Campus meeting</p>
                  <p className="mt-1 text-sm text-secondary-text">
                    {session.location || 'Campus Wellness Center'}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-secondary-text">
                {session.status === 'Confirmed' && 'This session is scheduled as an in-person campus meeting. Arrive at the listed location and move the session forward as the student checks in.'}
                {session.status === 'Ready' && 'The student is checked in and ready for the in-person counseling meeting on campus.'}
                {session.status === 'In Progress' && 'The counselor and student are currently meeting in person on campus. Use the status controls to keep the session state updated.'}
                {session.status === 'Completed' && 'This in-person counseling meeting has been completed. Review the saved notes, follow-up plan, and assigned resources below.'}
                {session.status === 'Cancelled' && 'This in-person counseling meeting was cancelled. The campus meeting location is no longer active for this session.'}
              </p>
            </div>
          )}

          {!isCounselor && (
            <div className="mt-8 space-y-5">
              <div className="rounded-[1.5rem] bg-emerald-50/80 p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">Shared follow-up summary</p>
                <p className="mt-3 text-sm leading-6 text-secondary-text">
                  {session.sharedSummary || 'Your counselor has not added a student-visible summary yet.'}
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-secondary-bg/80 p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Action plan</p>
                <p className="mt-3 text-sm leading-6 text-secondary-text">
                  {session.actionPlan || 'Your counselor has not shared an action plan yet.'}
                </p>
              </div>

              {session.followUpRecommended && (
                <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50/90 p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">Follow-up recommended</p>
                  <p className="mt-3 text-sm leading-6 text-secondary-text">
                    Next follow-up date: {session.followUpDate ? new Date(session.followUpDate).toLocaleDateString() : 'To be scheduled'}.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {session.allowedActions?.canCheckIn && (
                  <button type="button" onClick={() => handleStatusUpdate('Ready')} disabled={updatingStatus} className="pharmacy-primary disabled:opacity-50">
                    Check In
                  </button>
                )}
                {session.allowedActions?.canLeaveFeedback && (
                  <Link to={`/mental-health/sessions/${session._id}/feedback`} className="pharmacy-primary">
                    Leave Feedback
                  </Link>
                )}
              </div>
            </div>
          )}

          {isCounselor && (
            <div className="mt-8 space-y-5">
              <div className="grid gap-3 sm:grid-cols-4">
                {['Confirmed', 'In Progress', 'Completed', 'Cancelled'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusUpdate(status)}
                    disabled={updatingStatus || session.status === status}
                    className={session.status === status ? 'pharmacy-primary disabled:opacity-100' : 'pharmacy-secondary disabled:opacity-50'}
                  >
                    {pendingStatus === status ? `Updating ${status}...` : status}
                  </button>
                ))}
              </div>

              {canManageCounselorDocumentation ? (
                <>
                  <div className="rounded-[1.5rem] border border-[#d7e4ea] bg-white/70 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Summary templates</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {summaryTemplates.map((template) => (
                        <button
                          key={template}
                          type="button"
                          onClick={() => {
                            setSharedSummary(template);
                            updateNoteField('sharedSummary', template);
                          }}
                          className="rounded-full bg-secondary-bg px-4 py-2 text-xs font-semibold text-primary-text"
                        >
                          Use template
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Private counselor notes</label>
                    <textarea
                      rows={6}
                      value={confidentialNotes}
                      onChange={(event) => {
                        setConfidentialNotes(event.target.value);
                        updateNoteField('confidentialNotes', event.target.value);
                      }}
                      className={cn('student-field min-h-36 resize-none', noteErrors.confidentialNotes && 'ring-2 ring-red-300')}
                      placeholder="Visible only to counselors."
                    />
                    {noteErrors.confidentialNotes && <p className="text-sm text-red-600">{noteErrors.confidentialNotes}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Student-visible summary</label>
                    <textarea
                      rows={4}
                      value={sharedSummary}
                      onChange={(event) => {
                        setSharedSummary(event.target.value);
                        updateNoteField('sharedSummary', event.target.value);
                      }}
                      className={cn('student-field min-h-28 resize-none', noteErrors.sharedSummary && 'ring-2 ring-red-300')}
                      placeholder="This will be shown to the student after the session."
                    />
                    {noteErrors.sharedSummary && <p className="text-sm text-red-600">{noteErrors.sharedSummary}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Action plan</label>
                    <textarea
                      rows={4}
                      value={actionPlan}
                      onChange={(event) => {
                        setActionPlan(event.target.value);
                        updateNoteField('actionPlan', event.target.value);
                      }}
                      className={cn('student-field min-h-28 resize-none', noteErrors.actionPlan && 'ring-2 ring-red-300')}
                      placeholder="Coping tools, next steps, or routines to revisit."
                    />
                    {noteErrors.actionPlan && <p className="text-sm text-red-600">{noteErrors.actionPlan}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Assigned resource note</label>
                    <textarea
                      rows={3}
                      value={assignedResourceMessage}
                      onChange={(event) => {
                        setAssignedResourceMessage(event.target.value);
                        updateNoteField('assignedResourceMessage', event.target.value);
                      }}
                      className={cn('student-field min-h-24 resize-none', noteErrors.assignedResourceMessage && 'ring-2 ring-red-300')}
                      placeholder="Optional explanation for why these resources were assigned."
                    />
                    {noteErrors.assignedResourceMessage && <p className="text-sm text-red-600">{noteErrors.assignedResourceMessage}</p>}
                  </div>

                  <div className="rounded-[1.5rem] border border-[#d7e4ea] bg-white/70 p-5">
                    <label className="flex items-center gap-3 text-sm font-semibold text-primary-text">
                      <input
                        type="checkbox"
                        checked={followUpRecommended}
                        onChange={(event) => {
                          setFollowUpRecommended(event.target.checked);
                          const nextChecked = event.target.checked;
                          const nextDateValue = nextChecked ? followUpDate : '';
                          if (!nextChecked) {
                            setFollowUpDate('');
                          }
                          updateNoteField('followUpRecommended', nextChecked);
                          updateNoteField('followUpDate', nextDateValue);
                        }}
                      />
                      Recommend a follow-up session
                    </label>

                    {followUpRecommended && (
                      <div className="mt-4 space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Follow-up date</label>
                        <input
                          type="date"
                          min={minimumFollowUpDate}
                          value={followUpDate}
                          onChange={(event) => {
                            setFollowUpDate(event.target.value);
                            updateNoteField('followUpDate', event.target.value);
                          }}
                          className={cn('student-field', noteErrors.followUpDate && 'ring-2 ring-red-300')}
                        />
                        {noteErrors.followUpDate && <p className="text-sm text-red-600">{noteErrors.followUpDate}</p>}
                      </div>
                    )}
                  </div>

                  <button type="button" onClick={handleSaveNotes} disabled={saving} className="pharmacy-primary disabled:opacity-50">
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Notes & Follow-Up'}
                  </button>
                </>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-[#c9dde6] bg-white/70 px-5 py-6 text-sm leading-6 text-secondary-text">
                  {session.status === 'Cancelled'
                    ? 'Cancelled sessions no longer accept counselor notes or follow-up updates.'
                    : 'Move the session to In Progress to unlock counselor notes, assigned resources, and follow-up details.'}
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="pharmacy-panel p-7">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-accent-primary" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Assigned resources</p>
                <p className="mt-1 text-sm text-secondary-text">
                  {isCounselor ? 'Select resources to attach to this counseling session.' : 'Resources shared by your counselor.'}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {isCounselor && canManageCounselorDocumentation ? (
                resources.slice(0, 10).map((resource) => {
                  const selected = selectedResources.includes(resource._id);
                  const presentation = getResourceTypePresentation(resource.type);
                  const ResourceIcon = presentation.icon;
                  return (
                    <button
                      key={resource._id}
                      type="button"
                      onClick={() => {
                        const nextResources = selected
                          ? selectedResources.filter((entry) => entry !== resource._id)
                          : [...selectedResources, resource._id];
                        setSelectedResources(nextResources);
                        updateNoteField('selectedResources', nextResources);
                      }}
                      className={selected ? 'w-full rounded-2xl bg-accent-primary px-5 py-4 text-left text-white' : 'w-full rounded-2xl bg-secondary-bg/80 px-5 py-4 text-left text-primary-text'}
                    >
                      <div className="flex items-start gap-3">
                        <span className={selected ? 'inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white' : `inline-flex h-10 w-10 items-center justify-center rounded-2xl ${presentation.badgeClass}`}>
                          <ResourceIcon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold">{resource.title}</p>
                          <p className={selected ? 'mt-1 text-sm text-white/80' : 'mt-1 text-sm text-secondary-text'}>{resource.type}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : isCounselor ? (
                <div className="rounded-2xl border border-dashed border-[#c9dde6] bg-white/70 px-5 py-5 text-sm leading-6 text-secondary-text">
                  {session.status === 'Cancelled'
                    ? 'This session is cancelled, so resource assignment is locked.'
                    : 'Assigned resources become available once the session is moved to In Progress.'}
                </div>
              ) : (
                <>
                  {session.assignedResourceMessage && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/90 px-5 py-4 text-sm text-secondary-text">
                      {session.assignedResourceMessage}
                    </div>
                  )}

                  {session.assignedResources?.length ? session.assignedResources.map((resource) => {
                    const presentation = getResourceTypePresentation(resource.type);
                    const ResourceIcon = presentation.icon;
                    return (
                    <Link key={resource._id || resource.id} to={`/mental-health/resources/${resource._id || resource.id}`} className="block rounded-2xl bg-secondary-bg/80 px-5 py-4">
                      <div className="flex items-start gap-3">
                        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${presentation.badgeClass}`}>
                          <ResourceIcon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-primary-text">{resource.title}</p>
                          <p className="mt-1 text-sm text-secondary-text">{resource.type}</p>
                        </div>
                      </div>
                    </Link>
                    );
                  }) : (
                    <p className="text-sm text-secondary-text">No resources assigned yet.</p>
                  )}
                </>
              )}
            </div>
            {isCounselor && noteErrors.selectedResources && <p className="mt-3 text-sm text-red-600">{noteErrors.selectedResources}</p>}
          </section>
        </aside>
        </div>

        <DismissibleBanner
          message={statusMessage}
          tone="success"
          onClose={() => setStatusMessage('')}
          className="max-w-6xl"
        />
        <DismissibleBanner
          message={error}
          tone="error"
          onClose={() => setError('')}
          className="max-w-6xl"
        />
      </div>
    </div>
  );
}
