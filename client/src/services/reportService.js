import API from './api';

/**
 * Report Service — Phase 6B
 * Handles all teacher and admin reporting API calls.
 */

// 1. Get Exam Overview Report (statistics and question accuracy summary)
export const getExamReport = async (examId, params = {}) => {
  const response = await API.get(`/reports/exams/${examId}`, { params });
  return response.data;
};

// 2. Get Student Performance Report for an Exam (sortable, searchable, paginated)
export const getExamStudentsReport = async (examId, params = {}) => {
  const response = await API.get(`/reports/exams/${examId}/students`, { params });
  return response.data;
};

// 3. Get Question Performance Breakdown
export const getExamQuestionsReport = async (examId) => {
  const response = await API.get(`/reports/exams/${examId}/questions`);
  return response.data;
};

// 4. Get Teacher's Exams Overview Report
export const getTeacherOverview = async (params = {}) => {
  const response = await API.get('/reports/teacher/overview', { params });
  return response.data;
};

// 5. Get Admin System-Wide Overview
export const getAdminOverview = async (params = {}) => {
  const response = await API.get('/reports/admin/overview', { params });
  return response.data;
};

// 6. Get Admin Exam-Level Summaries
export const getAdminExams = async (params = {}) => {
  const response = await API.get('/reports/admin/exams', { params });
  return response.data;
};

export default {
  getExamReport,
  getExamStudentsReport,
  getExamQuestionsReport,
  getTeacherOverview,
  getAdminOverview,
  getAdminExams,
};
