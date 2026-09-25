import API from './api';

// ─── Exam Endpoints ──────────────────────────────────────────────────────────

export const getExams = async (params = {}) => {
  const response = await API.get('/exams', { params });
  return response.data;
};

export const getExamById = async (id) => {
  const response = await API.get(`/exams/${id}`);
  return response.data;
};

export const createExam = async (examData) => {
  const response = await API.post('/exams', examData);
  return response.data;
};

export const updateExam = async (id, examData) => {
  const response = await API.put(`/exams/${id}`, examData);
  return response.data;
};

export const deleteExam = async (id) => {
  const response = await API.delete(`/exams/${id}`);
  return response.data;
};

export const publishExam = async (id) => {
  const response = await API.patch(`/exams/${id}/publish`);
  return response.data;
};

export const unpublishExam = async (id) => {
  const response = await API.patch(`/exams/${id}/unpublish`);
  return response.data;
};

// ─── Question Endpoints ──────────────────────────────────────────────────────

export const getQuestions = async (examId) => {
  const response = await API.get(`/exams/${examId}/questions`);
  return response.data;
};

export const createQuestion = async (examId, questionData) => {
  const response = await API.post(`/exams/${examId}/questions`, questionData);
  return response.data;
};

export const updateQuestion = async (questionId, questionData) => {
  const response = await API.put(`/questions/${questionId}`, questionData);
  return response.data;
};

export const deleteQuestion = async (questionId) => {
  const response = await API.delete(`/questions/${questionId}`);
  return response.data;
};
