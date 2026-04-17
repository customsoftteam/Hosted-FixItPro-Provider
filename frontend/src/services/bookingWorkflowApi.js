import api from './api';

export const fetchProviderBookings = async () => {
  const { data } = await api.get('/bookings');
  return data?.bookings || [];
};

export const acceptBooking = async (bookingId) => {
  const { data } = await api.patch(`/bookings/${bookingId}/accept`);
  return data;
};

export const rejectBooking = async (bookingId) => {
  const { data } = await api.patch(`/bookings/${bookingId}/reject`);
  return data;
};

export const startService = async (bookingId) => {
  const { data } = await api.patch(`/bookings/${bookingId}/start`);
  return data;
};

export const pauseService = async (bookingId) => {
  const { data } = await api.patch(`/bookings/${bookingId}/pause`);
  return data;
};

export const resumeService = async (bookingId) => {
  const { data } = await api.patch(`/bookings/${bookingId}/resume`);
  return data;
};

export const cancelBooking = async (bookingId) => {
  const { data } = await api.patch(`/bookings/${bookingId}/cancel`);
  return data;
};

export const fetchServiceSteps = async (bookingId) => {
  const { data } = await api.get(`/bookings/${bookingId}/steps`);
  return {
    steps: data?.steps || [],
    completedSteps: data?.completedSteps || [],
    status: data?.status,
    serviceStartTime: data?.serviceStartTime || null,
    pausedDurationSeconds: Number(data?.pausedDurationSeconds) || 0,
    pauseStartedAt: data?.pauseStartedAt || null,
    serviceDuration: Number(data?.serviceDuration) || 0,
  };
};

export const completeServiceStep = async (bookingId, stepOrder) => {
  const { data } = await api.patch(`/bookings/${bookingId}/steps`, { stepOrder });
  return data;
};

export const sendBookingOtp = async (bookingId) => {
  const { data } = await api.post(`/bookings/${bookingId}/request-otp`);
  return data;
};

export const verifyBookingOtp = async (bookingId, otp) => {
  const { data } = await api.post(`/bookings/${bookingId}/verify-otp`, { otp });
  return data;
};
