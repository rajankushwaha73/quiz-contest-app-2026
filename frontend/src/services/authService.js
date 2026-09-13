import api from './api';

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email }).then((res) => res.data.message);

export const resetPassword = (token, password) =>
  api.post(`/auth/reset-password/${token}`, { password }).then((res) => res.data.message);
