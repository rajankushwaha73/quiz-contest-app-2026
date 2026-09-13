import api from './api';

export const getAvailableQuizzes = () => api.get('/student/quizzes').then((res) => res.data.data);

export const getQuizDetails = (id) => api.get(`/student/quizzes/${id}`).then((res) => res.data.data);

export const joinContest = (contestCode) =>
  api.post('/student/quizzes/join', { contestCode }).then((res) => res.data.data);

// Attempt engine
export const startAttempt = (quizId) =>
  api.post(`/student/quizzes/${quizId}/start`).then((res) => res.data.data);

export const saveAnswer = (attemptId, questionId, selectedOptionId) =>
  api.put(`/student/attempts/${attemptId}/answer`, { questionId, selectedOptionId });

export const submitAttempt = (attemptId) =>
  api.post(`/student/attempts/${attemptId}/submit`).then((res) => res.data.message);

// Results
export const getMyResult = (quizId) => api.get(`/student/quizzes/${quizId}/result`).then((res) => res.data.data);

export const getLeaderboard = (quizId) => api.get(`/student/quizzes/${quizId}/leaderboard`).then((res) => res.data.data);

export const getLeaderboardPreview = () => api.get('/leaderboard-preview').then((res) => res.data.data);

export const getAttemptHistory = () => api.get('/student/attempts/history').then((res) => res.data.data);
