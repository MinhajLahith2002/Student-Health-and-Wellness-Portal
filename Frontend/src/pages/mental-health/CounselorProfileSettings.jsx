import { useEffect, useState } from 'react';
import { BadgeCheck, BriefcaseBusiness, Save, Sparkles, UserRound } from 'lucide-react';
import DismissibleBanner from '../../components/DismissibleBanner';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../lib/api';
import { cn } from '../../lib/utils';

function hasLetters(value) {
  return /[A-Za-z]/.test(value);
}

function hasDigits(value) {
  return /\d/.test(value);
}

function hasInvalidNameCharacters(value) {
  return /[^A-Za-z.\s'-]/.test(value);
}

function hasInvalidSpecialtyCharacters(value) {
  return /[^A-Za-z\s&/-]/.test(value);
}

function validateField(name, value) {
  const trimmed = `${value ?? ''}`.trim();

  switch (name) {
    case 'name':
      if (!trimmed) return 'Display name is required.';
      if (!hasLetters(trimmed) || hasDigits(trimmed)) return 'Display name must use words only and cannot include numbers.';
      if (hasInvalidNameCharacters(trimmed)) return 'Display name cannot include special characters.';
      return '';
    case 'specialty':
      if (!trimmed) return 'Specialty is required.';
      if (!hasLetters(trimmed) || hasDigits(trimmed)) return 'Specialty must use words only and cannot include numbers.';
      if (hasInvalidSpecialtyCharacters(trimmed)) return 'Specialty cannot include special characters.';
      return '';
    case 'experience': {
      if (trimmed === '') return '';
      const normalized = Number(trimmed);
      if (Number.isNaN(normalized) || normalized < 0) return 'Years of experience cannot be negative.';
      if (normalized > 80) return 'Years of experience must stay below 81.';
      return '';
    }
    case 'bio':
      if (trimmed.length < 20) return 'Add a slightly longer bio so students can understand your support area.';
      if (!hasLetters(trimmed)) return 'Bio should contain meaningful words, not only numbers or symbols.';
      return '';
    case 'educationText':
      if (trimmed && !hasLetters(trimmed)) return 'Education and credentials should contain words, not only numbers or symbols.';
      return '';
    default:
      return '';
  }
}

function validateProfile(profile) {
  return {
    name: validateField('name', profile.name),
    specialty: validateField('specialty', profile.specialty),
    experience: validateField('experience', profile.experience),
    bio: validateField('bio', profile.bio),
    educationText: validateField('educationText', profile.educationText)
  };
}

function toProfileState(data) {
  return {
    name: data.name || '',
    specialty: data.specialty || '',
    bio: data.bio || '',
    experience: data.experience ?? '',
    educationText: Array.isArray(data.education) ? data.education.join('\n') : ''
  };
}

function buildProfileFromUser(user) {
  return {
    name: user?.name || '',
    specialty: user?.specialty || '',
    bio: user?.bio || '',
    experience: user?.experience ?? '',
    educationText: Array.isArray(user?.education) ? user.education.join('\n') : ''
  };
}

const basicFields = [
  {
    key: 'name',
    label: 'Display name',
    type: 'text',
    placeholder: 'Dr. Ava Thompson',
    helper: 'This is the public name students will see before booking.'
  },
  {
    key: 'specialty',
    label: 'Specialty',
    type: 'text',
    placeholder: 'Student Wellness Counselor',
    helper: 'Keep this aligned with the kind of counseling support you provide.'
  },
  {
    key: 'experience',
    label: 'Years of experience',
    type: 'number',
    placeholder: '7',
    helper: 'Use a simple number only.'
  }
];

export default function CounselorProfileSettings() {
  const { user, syncUser } = useAuth();
  const [profile, setProfile] = useState(() => buildProfileFromUser(user));
  const [status, setStatus] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    specialty: '',
    experience: '',
    bio: '',
    educationText: ''
  });
  const [saving, setSaving] = useState(false);
  const credentialCount = profile.educationText.split('\n').filter((entry) => entry.trim()).length;
  const hasPreviewDetails = Boolean(profile.specialty || profile.experience !== '' || credentialCount);

  useEffect(() => {
    if (!status || !status.includes('successfully')) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStatus('');
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [status]);

  useEffect(() => {
    setProfile((current) => {
      if (current.name || current.specialty || current.bio || current.educationText || current.experience !== '') {
        return current;
      }

      return buildProfileFromUser(user);
    });
  }, [user]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch('/users/profile');
        if (!active) return;
        setProfile(toProfileState(data));
        setFieldErrors(validateProfile(toProfileState(data)));
      } catch (err) {
        if (!active) return;
        setStatus(err.message || 'Failed to load counselor profile');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = validateProfile(profile);
    const normalizedExperience = profile.experience === '' ? '' : Number(profile.experience);
    setFieldErrors(errors);

    if (Object.values(errors).some(Boolean)) {
      setStatus('Please fix the highlighted profile fields before saving.');
      return;
    }

    try {
      setSaving(true);
      const updatedProfile = await apiFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profile.name.trim(),
          specialty: profile.specialty.trim(),
          bio: profile.bio.trim(),
          experience: normalizedExperience === '' ? 0 : normalizedExperience,
          education: profile.educationText
            .split('\n')
            .map((entry) => entry.trim())
            .filter(Boolean)
        })
      });
      const normalizedProfile = toProfileState(updatedProfile);
      setProfile(normalizedProfile);
      setFieldErrors(validateProfile(normalizedProfile));
      syncUser(updatedProfile);
      setStatus('Profile updated successfully.');
    } catch (err) {
      setStatus(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  function updateField(field, value) {
    setProfile((current) => {
      const nextProfile = { ...current, [field]: value };
      setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: validateField(field, value) }));
      return nextProfile;
    });
    if (status) setStatus('');
  }

  return (
    <div className="pharmacy-shell min-h-screen pb-16">
      <div className="max-w-4xl mx-auto px-8 pt-4">
        <div className="pharmacy-panel p-7">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-start">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                Profile Settings
              </span>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-primary-text">Keep your public counselor profile current.</h1>
              <p className="mt-3 max-w-3xl text-secondary-text">
                These profile details power counselor discovery, specialty summaries, and the booking flow students see before selecting one of your open slots.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/80 bg-white/75 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Student preview</p>
              <div className="mt-3 flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <UserRound className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-primary-text">{profile.name || 'Your display name'}</p>
                  {profile.specialty ? (
                    <p className="mt-1 text-sm text-secondary-text">{profile.specialty}</p>
                  ) : (
                    <p className="mt-1 text-sm text-secondary-text">Add a specialty so students can recognize your support area.</p>
                  )}
                </div>
              </div>
              {hasPreviewDetails ? (
                <div className="mt-3 space-y-2.5 text-sm text-secondary-text">
                  {profile.experience !== '' && profile.experience !== null ? (
                    <div className="flex items-center gap-2">
                      <BriefcaseBusiness className="h-4 w-4 text-emerald-700" />
                      <span>{profile.experience} years of experience</span>
                    </div>
                  ) : null}
                  {credentialCount ? (
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-emerald-700" />
                      <span>{credentialCount} credential line{credentialCount === 1 ? '' : 's'} listed</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-3 rounded-2xl bg-slate-50/80 px-4 py-3 text-sm leading-6 text-secondary-text">
                  Add your public details here to make the counselor directory feel complete and trustworthy for students.
                </div>
              )}
            </div>
          </div>

          <DismissibleBanner
            message={status}
            tone={status.includes('successfully') ? 'success' : 'error'}
            onClose={() => setStatus('')}
            className="mt-5"
          />

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <section className="rounded-[1.5rem] border border-white/80 bg-slate-50/60 p-5">
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Public identity</p>
                <p className="mt-2 text-sm leading-6 text-secondary-text">These are the main details students use to recognize and choose your support.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {basicFields.map((field) => (
                  <div key={field.key} className={field.key === 'experience' ? 'space-y-2 md:col-span-2 xl:max-w-sm' : 'space-y-2'}>
                    <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">{field.label}</label>
                    <input
                      type={field.type}
                      min={field.type === 'number' ? '0' : undefined}
                      value={profile[field.key]}
                      onChange={(event) => updateField(field.key, event.target.value)}
                      className={cn('student-field', fieldErrors[field.key] && 'ring-2 ring-red-300')}
                      placeholder={field.placeholder}
                    />
                    <p className="text-xs leading-5 text-secondary-text">{field.helper}</p>
                    {fieldErrors[field.key] && <p className="text-sm text-red-600">{fieldErrors[field.key]}</p>}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-white/80 bg-slate-50/60 p-5">
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Counselor summary</p>
                <p className="mt-2 text-sm leading-6 text-secondary-text">Give students a calm, credible overview of the support they can expect from you.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Bio</label>
                <textarea
                  rows={6}
                  value={profile.bio}
                  onChange={(event) => updateField('bio', event.target.value)}
                  className={cn('student-field min-h-36 resize-none', fieldErrors.bio && 'ring-2 ring-red-300')}
                  placeholder="Describe your counseling style, support areas, and the kinds of student concerns you help with."
                />
                <p className="text-xs leading-5 text-secondary-text">A clear bio helps students feel confident before they book.</p>
                {fieldErrors.bio && <p className="text-sm text-red-600">{fieldErrors.bio}</p>}
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-white/80 bg-slate-50/60 p-5">
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Credentials</p>
                <p className="mt-2 text-sm leading-6 text-secondary-text">Add one qualification or credential per line so students can quickly scan your background.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Education and credentials</label>
                <textarea
                  rows={4}
                  value={profile.educationText}
                  onChange={(event) => updateField('educationText', event.target.value)}
                  className={cn('student-field min-h-28 resize-none', fieldErrors.educationText && 'ring-2 ring-red-300')}
                  placeholder={'MSc Counseling Psychology - SLIIT\nLicensed Campus Wellness Counselor'}
                />
                <p className="text-xs leading-5 text-secondary-text">Keep this concise and easy to scan.</p>
                {fieldErrors.educationText && <p className="text-sm text-red-600">{fieldErrors.educationText}</p>}
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-white/80 bg-white/70 p-4 backdrop-blur-sm">
              <p className="max-w-2xl text-sm leading-6 text-secondary-text">
                Save updates here to refresh the counselor directory, booking page, and public counselor profile.
              </p>
              <button type="submit" disabled={saving} className="pharmacy-primary disabled:opacity-50">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
