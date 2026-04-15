import User from '../models/User.js';

function normalizeName(value) {
  return String(value || '').trim();
}

async function getDoctorScopeIds(user) {
  if (!user?.id || user.role !== 'doctor') {
    return user?.id ? [user.id] : [];
  }

  const currentDoctor = await User.findById(user.id).select('name role');
  if (!currentDoctor || currentDoctor.role !== 'doctor') {
    return [user.id];
  }

  const normalizedName = normalizeName(currentDoctor.name);
  if (!normalizedName) {
    return [user.id];
  }

  const linkedDoctors = await User.find({
    role: 'doctor',
    name: normalizedName
  }).select('_id');

  const linkedIds = linkedDoctors.map((doctor) => doctor._id.toString());
  if (linkedIds.length === 0) {
    return [user.id];
  }

  return [...new Set(linkedIds)];
}

export {
  getDoctorScopeIds
};
