import api from './api';

// Users
export const getUsers = (role) => api.get('/admin/users', { params: role ? { role } : {} }).then((res) => res.data.data);

export const createUser = (payload) => api.post('/admin/users', payload).then((res) => res.data.data);

export const toggleUserActive = (id) => api.patch(`/admin/users/${id}/toggle-active`).then((res) => res.data.data);

export const deleteUser = (id) => api.delete(`/admin/users/${id}`).then((res) => res.data);

// Quizzes & results
export const getAllQuizzes = () => api.get('/admin/quizzes').then((res) => res.data.data);

export const getAllResults = () => api.get('/admin/results').then((res) => res.data.data);

// Analytics
export const getAnalytics = () => api.get('/admin/analytics').then((res) => res.data.data);
