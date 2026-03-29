import { apiFetch } from './api';

function buildQuery(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'All') {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

export function getProviders(params = {}) {
  return apiFetch(`/users/providers${buildQuery(params)}`);
}

export function getProviderById(id) {
  return apiFetch(`/users/providers/${id}`);
}

export function getProviderAvailability(providerId, date) {
  return apiFetch(`/availability/${providerId}${buildQuery({ date })}`);
}

export function getMyAvailability() {
  return apiFetch('/availability/me');
}

export function createAvailability(payload) {
  return apiFetch('/availability', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateAvailability(id, payload) {
  return apiFetch(`/availability/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export function deleteAvailability(id) {
  return apiFetch(`/availability/${id}`, {
    method: 'DELETE'
  });
}
