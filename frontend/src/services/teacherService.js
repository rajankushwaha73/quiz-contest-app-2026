import api from './api';

// Quizzes
export const getMyQuizzes = () => api.get('/teacher/quizzes').then((res) => res.data.data);

export const getQuizById = (id) => api.get(`/teacher/quizzes/${id}`).then((res) => res.data.data);

export const createQuiz = (payload) => api.post('/teacher/quizzes', payload).then((res) => res.data.data);

export const updateQuiz = (id, payload) => api.put(`/teacher/quizzes/${id}`, payload).then((res) => res.data.data);

export const deleteQuiz = (id) => api.delete(`/teacher/quizzes/${id}`).then((res) => res.data);

export const togglePublish = (id) => api.patch(`/teacher/quizzes/${id}/publish`).then((res) => res.data.data);

export const releaseResult = (id) => api.patch(`/teacher/quizzes/${id}/release-result`).then((res) => res.data.data);

export const getQuizResults = (id) => api.get(`/teacher/quizzes/${id}/results`).then((res) => res.data.data);

// Questions
export const getQuestions = (quizId) =>
  api.get(`/teacher/quizzes/${quizId}/questions`).then((res) => res.data.data);

export const addQuestion = (quizId, payload) =>
  api.post(`/teacher/quizzes/${quizId}/questions`, payload).then((res) => res.data.data);

export const updateQuestion = (questionId, payload) =>
  api.put(`/teacher/questions/${questionId}`, payload).then((res) => res.data.data);

export const deleteQuestion = (questionId) =>
  api.delete(`/teacher/questions/${questionId}`).then((res) => res.data);
