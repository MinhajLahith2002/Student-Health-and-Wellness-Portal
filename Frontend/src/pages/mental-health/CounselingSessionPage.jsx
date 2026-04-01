import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FileText, Save } from 'lucide-react';
import { getCounselingSessionById, updateCounselingSessionNotes, updateCounselingSessionStatus } from '../../lib/counseling';
import { getMentalHealthResources } from '../../lib/mentalHealth';
import { useAuth } from '../../hooks/useAuth';

const summaryTemplates = [
  'We reviewed current stressors, named immediate coping tools, and agreed on one manageable step for the week.',
  'The session focused on emotional regulation, restoring routine, and identifying support people the student can lean on.',
  'We discussed academic pressure, sleep strain, and a short recovery plan with boundaries and check-ins.'
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

export default function CounselingSessionPage() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [resources, setResources] = useState([]);
  const [confidentialNotes, setConfidentialNotes] = useState('');
  const [sharedSummary, setSharedSummary] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [assignedResourceMessage, setAssignedResourceMessage] = useState('');
  const [followUpRecommended, setFollowUpRecommended] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [selectedResources, setSelectedResources] = useState([]);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [followUpDateError, setFollowUpDateError] = useState('');
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [sessionData, resourceList] = await Promise.all([
          getCounselingSessionById(sessionId),
          getMentalHealthResources({ limit: 20 })
        ]);
        if (!active) return;
        setSession(sessionData);
        setResources(Array.isArray(resourceList) ? resourceList : []);
        setConfidentialNotes(sessionData.confidentialNotes || '');
        setSharedSummary(sessionData.sharedSummary || '');
        setActionPlan(sessionData.actionPlan || '');
        setAssignedResourceMessage(sessionData.assignedResourceMessage || '');
        setFollowUpRecommended(Boolean(sessionData.followUpRecommended));
        setFollowUpDate(sessionData.followUpDate ? getLocalDateValue(new Date(sessionData.followUpDate)) : '');
        setSelectedResources(Array.isArray(sessionData.assignedResources) ? sessionData.assignedResources.map((entry) => entry._id || entry) : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load session');
      }
    })();
    return () => {
      active = false;
    };
  }, [sessionId]);

  async function handleSaveNotes() {
    const minimumFollowUpDate = getMinimumFollowUpDate(session?.date);

    if (followUpRecommended && !followUpDate) {
      setError('Choose a follow-up date before saving the recommendation.');
      setFollowUpDateError('Choose a valid follow-up date.');
      return;
    }

    if (followUpRecommended && followUpDate < minimumFollowUpDate) {
      setError('Follow-up date must be on or after the allowed minimum date.');
      setFollowUpDateError(`Choose ${minimumFollowUpDate} or a later date.`);
      return;
    }

    try {
      setSaving(true);
      setError('');
      setStatusMessage('');
      setFollowUpDateError('');
      const updated = await updateCounselingSessionNotes(sessionId, {
        confidentialNotes: confidentialNotes.trim(),
        sharedSummary: sharedSummary.trim(),
        actionPlan: actionPlan.trim(),
        assignedResources: selectedResources,
        assignedResourceMessage: assignedResourceMessage.trim(),
        followUpRecommended,
        followUpDate: followUpRecommended ? followUpDate : null
      });
      setSession(updated);
      setStatusMessage('Session notes saved successfully.');
    } catch (err) {
      setError(err.message || 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusUpdate(status) {
    try {
      setUpdatingStatus(true);
      setError('');
      setStatusMessage('');
      const updated = await updateCounselingSessionStatus(sessionId, { status });
      setSession(updated);
      setStatusMessage(`Session updated to ${status}.`);
    } catch (err) {
      setError(err.message || 'Failed to update session status');
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (!session) return <div className="pt-36 px-6">{error || 'Loading session...'}</div>;

  const isCounselor = user?.role === 'counselor';
  const minimumFollowUpDate = getMinimumFollowUpDate(session.date);

  return (
    <div className={`${isCounselor ? 'pt-8' : 'pt-36'} pb-12 px-6 max-w-6xl mx-auto min-h-screen bg-primary-bg`}>
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr,0.8fr] gap-8">
        <section className="apple-card p-10 border-none bg-white/70 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Counseling Session</p>
          <h1 className="text-4xl font-semibold tracking-tight text-primary-text mt-4">
            {isCounselor ? session.studentName : session.counselorName}
          </h1>
          <p className="text-secondary-text mt-3">
            {new Date(session.date).toLocaleDateString()} • {session.time} • {session.type} • {session.status}
          </p>

          <div className="rounded-3xl bg-secondary-bg/70 p-6 mt-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-3">Session reason</p>
            <p className="text-primary-text/80 leading-relaxed">{session.reason}</p>
          </div>

          {(session.type === 'Video Call' || session.type === 'Chat') && session.meetingLink && (
            <a
              href={session.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex mt-6 px-5 py-3 rounded-2xl bg-accent-primary text-white font-bold"
            >
              {session.type === 'Chat' ? 'Open Secure Chat' : 'Join Video Session'}
            </a>
          )}

          {!isCounselor && (
            <>
              <div className="mt-8 rounded-3xl bg-accent-purple/10 p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-accent-purple font-bold mb-3">Shared Summary</p>
                <p className="text-primary-text/80 leading-relaxed">{session.sharedSummary || 'Your counselor has not added a shareable summary yet.'}</p>
              </div>

              <div className="mt-6 rounded-3xl bg-secondary-bg/70 p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-3">Action Plan</p>
                <p className="text-primary-text/80 leading-relaxed">{session.actionPlan || 'Your counselor has not shared an action plan yet.'}</p>
              </div>

              {session.followUpRecommended && (
                <div className="mt-6 rounded-3xl bg-amber-50 border border-amber-100 p-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-amber-700 font-bold mb-3">Follow-Up</p>
                  <p className="text-primary-text/80 leading-relaxed">
                    Recommended for {session.followUpDate ? new Date(session.followUpDate).toLocaleDateString() : 'a future session'}.
                  </p>
                </div>
              )}

              <div className="mt-8 flex gap-4">
                {session.status === 'Confirmed' && (
                  <button onClick={() => handleStatusUpdate('Ready')} disabled={updatingStatus} className="flex-1 py-4 bg-accent-purple text-white rounded-2xl font-bold disabled:opacity-50">
                    Check In
                  </button>
                )}
                {session.status === 'Completed' && (
                  <Link to={`/mental-health/sessions/${session._id}/feedback`} className="flex-1 py-4 bg-accent-primary text-white rounded-2xl font-bold text-center">
                    Leave Feedback
                  </Link>
                )}
              </div>
            </>
          )}

          {isCounselor && (
            <div className="mt-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Confirmed', 'In Progress', 'Completed'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusUpdate(status)}
                    disabled={updatingStatus || session.status === status}
                    className={`px-4 py-3 rounded-2xl font-bold text-sm ${session.status === status ? 'bg-accent-primary text-white' : 'bg-secondary-bg text-primary-text'} disabled:opacity-50`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <div className="rounded-2xl bg-secondary-bg/70 p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold mb-3">Session summary templates</p>
                <div className="flex flex-wrap gap-2">
                  {summaryTemplates.map((template) => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => setSharedSummary(template)}
                      className="px-4 py-2 rounded-full bg-white text-primary-text text-xs font-semibold"
                    >
                      Use Template
                    </button>
                  ))}
                </div>
              </div>
              <textarea rows={6} value={confidentialNotes} onChange={(event) => setConfidentialNotes(event.target.value)} className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none resize-none" placeholder="Confidential counselor notes" />
              <textarea rows={4} value={sharedSummary} onChange={(event) => setSharedSummary(event.target.value)} className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none resize-none" placeholder="Student-visible summary" />
              <textarea rows={4} value={actionPlan} onChange={(event) => setActionPlan(event.target.value)} className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none resize-none" placeholder="Action plan or coping steps" />
              <textarea rows={3} value={assignedResourceMessage} onChange={(event) => setAssignedResourceMessage(event.target.value)} className="w-full px-5 py-4 bg-secondary-bg rounded-2xl outline-none resize-none" placeholder="Optional note to explain why these resources were assigned" />
              <div className="rounded-2xl bg-secondary-bg/70 p-5 space-y-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-primary-text">
                  <input
                    type="checkbox"
                    checked={followUpRecommended}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setFollowUpRecommended(checked);
                      if (!checked) {
                        setFollowUpDateError('');
                      }
                    }}
                  />
                  Recommend a follow-up session
                </label>
                {followUpRecommended && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-secondary-text font-bold">Follow-Up Date</p>
                    <input
                      type="date"
                      value={followUpDate}
                      min={minimumFollowUpDate}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        if (!nextValue) {
                          setFollowUpDate('');
                          setFollowUpDateError('Choose a valid follow-up date.');
                        } else if (nextValue < minimumFollowUpDate) {
                          setFollowUpDate(minimumFollowUpDate);
                          setFollowUpDateError(`Choose ${minimumFollowUpDate} or a later date.`);
                        } else {
                          setFollowUpDate(nextValue);
                          setFollowUpDateError('');
                        }
                      }}
                      className={`w-full px-5 py-4 bg-white rounded-2xl outline-none ${
                        followUpDateError ? 'ring-2 ring-red-300' : ''
                      }`}
                    />
                    {followUpDateError && (
                      <p className="text-sm text-red-600">{followUpDateError}</p>
                    )}
                  </div>
                )}
              </div>
              <button onClick={handleSaveNotes} disabled={saving} className="w-full py-4 bg-accent-purple text-white rounded-2xl font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Notes & Summary'}
              </button>
            </div>
          )}
        </section>

        <aside className="space-y-8">
          <div className="apple-card p-8 border-none bg-white/70 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-5 h-5 text-accent-primary" />
              <h2 className="text-2xl font-semibold text-primary-text">Assigned Resources</h2>
            </div>
            {isCounselor ? (
              <div className="space-y-3">
                {resources.slice(0, 8).map((resource) => {
                  const selected = selectedResources.includes(resource._id);
                  return (
                    <button
                      key={resource._id}
                      onClick={() => setSelectedResources((current) => selected ? current.filter((entry) => entry !== resource._id) : [...current, resource._id])}
                      className={`w-full text-left rounded-2xl px-5 py-4 ${selected ? 'bg-accent-primary text-white' : 'bg-secondary-bg/70 text-primary-text'}`}
                    >
                      <p className="font-semibold">{resource.title}</p>
                      <p className={`text-sm mt-1 ${selected ? 'text-white/80' : 'text-secondary-text'}`}>{resource.type}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {session.assignedResourceMessage && (
                  <div className="rounded-2xl bg-amber-50 border border-amber-100 px-5 py-4">
                    <p className="text-sm text-amber-800">{session.assignedResourceMessage}</p>
                  </div>
                )}
                {session.assignedResources?.length ? session.assignedResources.map((resource) => (
                  <Link key={resource._id || resource.id} to={`/mental-health/resources/${resource._id || resource.id}`} className="block rounded-2xl bg-secondary-bg/70 px-5 py-4">
                    <p className="font-semibold text-primary-text">{resource.title}</p>
                    <p className="text-sm text-secondary-text mt-1">{resource.type}</p>
                  </Link>
                )) : <p className="text-sm text-secondary-text">No resources assigned yet.</p>}
              </div>
            )}
          </div>

          {isCounselor && (
            <button onClick={() => navigate('/counselor/sessions')} className="w-full py-4 bg-secondary-bg rounded-2xl font-bold text-primary-text">
              Back to Session List
            </button>
          )}
        </aside>
      </div>

      {statusMessage && <p className="text-emerald-600 mt-8">{statusMessage}</p>}
      {error && <p className="text-red-600 mt-8">{error}</p>}
    </div>
  );
}
