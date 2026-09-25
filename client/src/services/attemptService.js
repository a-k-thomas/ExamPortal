import API from './api';

// ─── Student Examination Attempt Service ────────────────────────────────────

/**
 * Fetch list of published examinations currently open for student attempts.
 */
export const getAvailableExams = async () => {
  const response = await API.get('/attempts/available-exams');
  return response.data;
};

/**
 * Start a new attempt or resume an existing in-progress attempt for an exam.
 */
export const startAttempt = async (examId) => {
  const response = await API.post(`/attempts/exams/${examId}/start`);
  return response.data;
};

/**
 * Retrieve attempt details, deadline, and student-safe questions.
 */
export const getAttempt = async (attemptId) => {
  const response = await API.get(`/attempts/${attemptId}`);
  return response.data;
};

/**
 * Persist or update the selected answer for a specific question.
 */
export const saveAnswer = async (attemptId, questionId, selectedAnswer) => {
  const response = await API.patch(`/attempts/${attemptId}/answer`, {
    questionId,
    selectedAnswer,
  });
  return response.data;
};

/**
 * Submit the examination attempt (transitions status to submitted).
 */
export const submitAttempt = async (attemptId, answers = []) => {
  const response = await API.post(`/attempts/${attemptId}/submit`, {
    answers,
  });
  return response.data;
};

/**
 * Retrieve the evaluated result for a submitted or auto-submitted attempt.
 */
export const getAttemptResult = async (attemptId) => {
  const response = await API.get(`/attempts/${attemptId}/result`);
  return response.data;
};

/**
 * Retrieve all examination attempts made by the authenticated student.
 */
export const getMyAttempts = async () => {
  const response = await API.get('/attempts/my-attempts');
  return response.data;
};


