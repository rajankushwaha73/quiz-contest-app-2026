import api from './api';

// PDF upload uses multipart/form-data - axios sets the correct Content-Type
// boundary automatically when given a FormData instance, so we don't set it manually.
export const generateQuestionsFromPDF = (quizId, file, numberOfQuestions) => {
  const formData = new FormData();
  formData.append('pdf', file);
  formData.append('numberOfQuestions', numberOfQuestions);

  return api
    .post(`/teacher/quizzes/${quizId}/generate-questions`, formData)
    .then((res) => res.data.data);
};
