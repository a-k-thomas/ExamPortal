import {
  getExamOverviewReport,
  getExamStudentPerformance,
  getExamQuestionReport,
  getAdminOverviewReport,
  getAdminExamsReport,
  getTeacherExamsReport,
} from '../services/reportingService.js';

// ─── GET /api/reports/exams/:examId ──────────────────────────────────────────
export const getExamReport = async (req, res) => {
  try {
    const { examId } = req.params;
    const { startDate, endDate, status } = req.query;

    const report = await getExamOverviewReport(examId, req.user, {
      startDate,
      endDate,
      status,
    });

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to generate examination report.',
    });
  }
};

// ─── GET /api/reports/exams/:examId/students ──────────────────────────────────
export const getExamStudentsReport = async (req, res) => {
  try {
    const { examId } = req.params;
    const { search, status, sortBy, sortOrder, page, limit } = req.query;

    const report = await getExamStudentPerformance(examId, req.user, {
      search,
      status,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      ...report,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to retrieve student performance report.',
    });
  }
};

// ─── GET /api/reports/exams/:examId/questions ─────────────────────────────────
export const getExamQuestionsReport = async (req, res) => {
  try {
    const { examId } = req.params;

    const report = await getExamQuestionReport(examId, req.user);

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to retrieve question performance report.',
    });
  }
};

// ─── GET /api/reports/teacher/overview ───────────────────────────────────────
export const getTeacherOverview = async (req, res) => {
  try {
    const { status, search } = req.query;

    const report = await getTeacherExamsReport(req.user._id, {
      status,
      search,
    });

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to retrieve teacher reporting overview.',
    });
  }
};

// ─── GET /api/reports/admin/overview ─────────────────────────────────────────
export const getAdminOverview = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const overview = await getAdminOverviewReport({
      startDate,
      endDate,
    });

    return res.status(200).json({
      success: true,
      overview,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to generate admin overview report.',
    });
  }
};

// ─── GET /api/reports/admin/exams ────────────────────────────────────────────
export const getAdminExams = async (req, res) => {
  try {
    const { status, search } = req.query;

    const exams = await getAdminExamsReport({
      status,
      search,
    });

    return res.status(200).json({
      success: true,
      count: exams.length,
      exams,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to generate admin exam reports.',
    });
  }
};

export default {
  getExamReport,
  getExamStudentsReport,
  getExamQuestionsReport,
  getTeacherOverview,
  getAdminOverview,
  getAdminExams,
};
