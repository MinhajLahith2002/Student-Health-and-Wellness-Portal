import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

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
      if (!hasLetters(trimmed) || hasDigits(trimmed)) {
        return 'Display name must use words only and cannot include numbers.';
      }
      if (hasInvalidNameCharacters(trimmed)) {
        return 'Display name cannot include special characters.';
      }
      return '';
    case 'specialty':
      if (!trimmed) return 'Specialty is required.';
      if (!hasLetters(trimmed) || hasDigits(trimmed)) {
        return 'Specialty must use words only and cannot include numbers.';
      }
      if (hasInvalidSpecialtyCharacters(trimmed)) {
        return 'Specialty cannot include special characters.';
      }
      return '';
    case 'experience': {
      if (trimmed === '') return '';
      const normalized = Number(trimmed);
      if (Number.isNaN(normalized) || normalized < 0) {
        return 'Years of experience cannot be negative.';
      }
      return '';
    }
    case 'bio':
      if (trimmed.length < 20) {
        return 'Add a slightly longer bio so students can understand your support area.';
      }
      if (!hasLetters(trimmed)) {
        return 'Bio should contain meaningful words, not only numbers or symbols.';
      }
      return '';
    case 'educationText':
      if (trimmed && !hasLetters(trimmed)) {
        return 'Education and credentials should contain words, not only numbers or symbols.';
      }
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

export default function CounselorProfileSettings() {
  const [profile, setProfile] = useState({
    name: '',
    specialty: '',
    bio: '',
    experience: '',
    educationText: ''
  });
  const [status, setStatus] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    specialty: '',
    experience: '',
    bio: '',
    educationText: ''
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch('/users/profile');
        if (!active) return;
        setProfile({
          name: data.name || '',
          specialty: data.specialty || '',
          bio: data.bio || '',
          experience: data.experience || '',
          educationText: Array.isArray(data.education) ? data.education.join('\n') : ''
        });
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
      await apiFetch('/users/profile', {
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
      setStatus('Profile updated successfully.');
    } catch (err) {
      setStatus(err.message || 'Failed to update profile');
    }
  }

  function updateField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: validateField(field, value) }));
    if (status && !status.includes('successfully')) {
      setStatus('');
    }
  }

  return (
    <div className="min-h-screen bg-[#FCFCFC] pt-32 px-6 pb-20">
      <div className="max-w-3xl mx-auto bg-white rounded-[32px] border border-[#F0F0F3] p-10">
        <h1 className="text-4xl font-bold text-[#18181B] tracking-tight">Profile Settings</h1>
        <p className="text-[#71717A] mt-3">Keep your counselor profile and specialty details up to date for student discovery.</p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#71717A]">Display Name</p>
            <input
              type="text"
              value={profile.name}
              onChange={(event) => updateField('name', event.target.value)}
              className={`w-full px-5 py-4 bg-[#F4F4F8] rounded-2xl outline-none ${fieldErrors.name ? 'ring-2 ring-red-300' : ''}`}
              placeholder="Display name"
            />
            {fieldErrors.name && <p className="text-sm text-red-600">{fieldErrors.name}</p>}
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#71717A]">Specialty</p>
            <input
              type="text"
              value={profile.specialty}
              onChange={(event) => updateField('specialty', event.target.value)}
              className={`w-full px-5 py-4 bg-[#F4F4F8] rounded-2xl outline-none ${fieldErrors.specialty ? 'ring-2 ring-red-300' : ''}`}
              placeholder="Specialty"
            />
            {fieldErrors.specialty && <p className="text-sm text-red-600">{fieldErrors.specialty}</p>}
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#71717A]">Years Of Experience</p>
            <input
              type="number"
              min="0"
              step="1"
              value={profile.experience}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (nextValue === '' || Number(nextValue) >= 0) {
                  updateField('experience', nextValue);
                }
              }}
              className={`w-full px-5 py-4 bg-[#F4F4F8] rounded-2xl outline-none ${fieldErrors.experience ? 'ring-2 ring-red-300' : ''}`}
              placeholder="Years of experience"
            />
            {fieldErrors.experience && <p className="text-sm text-red-600">{fieldErrors.experience}</p>}
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#71717A]">Bio</p>
            <textarea
              rows={6}
              value={profile.bio}
              onChange={(event) => updateField('bio', event.target.value)}
              className={`w-full px-5 py-4 bg-[#F4F4F8] rounded-2xl outline-none resize-none ${fieldErrors.bio ? 'ring-2 ring-red-300' : ''}`}
              placeholder="Short counselor bio"
            />
            {fieldErrors.bio && <p className="text-sm text-red-600">{fieldErrors.bio}</p>}
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#71717A]">Education And Credentials</p>
            <textarea
              rows={4}
              value={profile.educationText}
              onChange={(event) => updateField('educationText', event.target.value)}
              className={`w-full px-5 py-4 bg-[#F4F4F8] rounded-2xl outline-none resize-none ${fieldErrors.educationText ? 'ring-2 ring-red-300' : ''}`}
              placeholder="Education or credentials (one per line)"
            />
            {fieldErrors.educationText && <p className="text-sm text-red-600">{fieldErrors.educationText}</p>}
          </div>
          {status && <p className={`text-sm ${status.includes('successfully') ? 'text-emerald-600' : 'text-red-600'}`}>{status}</p>}
          <button type="submit" className="w-full py-4 bg-accent-purple text-white rounded-2xl font-bold">
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}
