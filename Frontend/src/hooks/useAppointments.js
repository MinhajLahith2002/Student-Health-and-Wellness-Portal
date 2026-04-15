import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';

/**
 * useAppointments Hook
 *
 * Purpose: Centralize all appointment-related business logic and API calls
 * Provides a reusable interface for any component that needs appointment data
 *
 * Features:
 * - Automatic fetching on mount or when userId changes
 * - Comprehensive error handling
 * - Loading states
 * - Methods for CRUD operations (Create, Read, Update, Delete)
 * - Optimistic updates (update UI immediately, sync with server)
 *
 * Usage:
 * ```
 * const {
 *   appointments,
 *   loading,
 *   error,
 *   refetch,
 *   bookAppointment,
 *   rescheduleAppointment,
 *   cancelAppointment
 * } = useAppointments(userId);
 *
 * if (loading) return <LoadingState />;
 * if (error) return <ErrorAlert message={error} />;
 * return <AppointmentList appointments={appointments} />;
 * ```
 */

export function useAppointments(
  userId,
  options = {}
) {
  const {
    autoFetch = true,          // Auto-fetch on mount
    refreshInterval = null,    // Auto-refresh interval (ms), null = disabled
    filter = null              // Optional filter: { status, startDate, endDate }
  } = options;

  // === STATE ===
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(autoFetch && !!userId);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // === FETCH ===

  /**
   * Fetch appointments from backend
   * Applies filters if provided
   */
  const fetchAppointments = useCallback(async () => {
    if (!userId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('studentId', userId);

      if (filter?.status) params.append('status', filter.status);
      if (filter?.startDate) params.append('startDate', filter.startDate);
      if (filter?.endDate) params.append('endDate', filter.endDate);

      const response = await apiFetch(`/appointments?${params}`);
      
      // Handle response format (backend returns { appointments } or direct array)
      const data = response.appointments || response || [];
      setAppointments(Array.isArray(data) ? data : []);
      setLastFetch(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointments';
      setError(errorMessage);
      console.error('useAppointments: Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, filter]);

  // === AUTO-FETCH EFFECT ===
  useEffect(() => {
    if (autoFetch) {
      fetchAppointments();
    }
  }, [autoFetch, fetchAppointments]);

  // === AUTO-REFRESH EFFECT ===
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(fetchAppointments, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, fetchAppointments]);

  // === CRUD OPERATIONS ===

  /**
   * Book a new appointment
   * Sends appointment data to backend
   * Optimistically updates local state
   */
  const bookAppointment = useCallback(async (appointmentData) => {
    try {
      const newAppointment = await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify(appointmentData)
      });

      // Optimistic update: add to local state immediately
      setAppointments(prev => [...prev, newAppointment]);
      return newAppointment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to book appointment';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Reschedule an existing appointment
   */
  const rescheduleAppointment = useCallback(async (appointmentId, newDate, newTime) => {
    try {
      const updated = await apiFetch(`/appointments/${appointmentId}/reschedule`, {
        method: 'PUT',
        body: JSON.stringify({ date: newDate, time: newTime })
      });

      // Optimistic update
      setAppointments(prev =>
        prev.map(a => a._id === appointmentId ? updated : a)
      );
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reschedule appointment';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Cancel an appointment
   */
  const cancelAppointment = useCallback(async (appointmentId, reason = '') => {
    try {
      const updated = await apiFetch(`/appointments/${appointmentId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'Cancelled',
          cancellationReason: reason
        })
      });

      // Optimistic update
      setAppointments(prev =>
        prev.map(a => a._id === appointmentId ? updated : a)
      );
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel appointment';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Check in to an appointment
   */
  const checkInAppointment = useCallback(async (appointmentId) => {
    try {
      const updated = await apiFetch(`/appointments/${appointmentId}/check-in`, {
        method: 'PUT',
        body: JSON.stringify({
          checkInAt: new Date().toISOString()
        })
      });

      // Optimistic update
      setAppointments(prev =>
        prev.map(a => a._id === appointmentId ? updated : a)
      );
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check in';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Get a single appointment by ID
   */
  const getAppointmentById = useCallback(async (appointmentId) => {
    try {
      return await apiFetch(`/appointments/${appointmentId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointment';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Update consultation notes/diagnosis (doctor only)
   */
  const updateConsultation = useCallback(async (appointmentId, consultationData) => {
    try {
      const updated = await apiFetch(`/appointments/${appointmentId}/consultation`, {
        method: 'PUT',
        body: JSON.stringify(consultationData)
      });

      // Optimistic update
      setAppointments(prev =>
        prev.map(a => a._id === appointmentId ? updated : a)
      );
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update consultation';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // === HELPER QUERIES ===

  /**
   * Get filtered subset of appointments
   */
  const getAppointmentsByStatus = useCallback((status) => {
    return appointments.filter(a => a.status === status);
  }, [appointments]);

  /**
   * Get upcoming appointments (Confirmed, Ready, In Progress)
   */
  const getUpcoming = useCallback(() => {
    return appointments.filter(a => 
      ['Confirmed', 'Ready', 'In Progress'].includes(a.status)
    );
  }, [appointments]);

  /**
   * Get completed appointments
   */
  const getCompleted = useCallback(() => {
    return appointments.filter(a => a.status === 'Completed');
  }, [appointments]);

  /**
   * Get cancelled appointments
   */
  const getCancelled = useCallback(() => {
    return appointments.filter(a => a.status === 'Cancelled');
  }, [appointments]);

  /**
   * Clear local error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // === RETURN PUBLIC API ===
  return {
    // Data
    appointments,
    loading,
    error,
    lastFetch,

    // Refresh
    refetch: fetchAppointments,
    clearError,

    // CRUD
    bookAppointment,
    rescheduleAppointment,
    cancelAppointment,
    checkInAppointment,
    getAppointmentById,
    updateConsultation,

    // Helpers
    getAppointmentsByStatus,
    getUpcoming,
    getCompleted,
    getCancelled
  };
}

/**
 * useAppointmentById Hook
 * Fetch a single appointment by ID
 * Useful for detail pages
 */
export function useAppointmentById(appointmentId, options = {}) {
  const {
    autoFetch = true,
    refreshInterval = null
  } = options;

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(autoFetch && !!appointmentId);
  const [error, setError] = useState(null);

  const fetchAppointment = useCallback(async () => {
    if (!appointmentId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch(`/appointments/${appointmentId}`);
      setAppointment(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointment';
      setError(errorMessage);
      console.error('useAppointmentById: Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    if (autoFetch) {
      fetchAppointment();
    }
  }, [autoFetch, fetchAppointment]);

  useEffect(() => {
    if (!refreshInterval) return undefined;

    const interval = setInterval(fetchAppointment, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, fetchAppointment]);

  const checkInAppointment = useCallback(async (targetAppointmentId = appointmentId) => {
    if (!targetAppointmentId) {
      throw new Error('Appointment ID required');
    }

    const updated = await apiFetch(`/appointments/${targetAppointmentId}/check-in`, {
      method: 'PUT',
      body: JSON.stringify({
        checkInAt: new Date().toISOString()
      })
    });

    setAppointment(updated);
    return updated;
  }, [appointmentId]);

  return {
    appointment,
    loading,
    error,
    refetch: fetchAppointment,
    checkInAppointment
  };
}
