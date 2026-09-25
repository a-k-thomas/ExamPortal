import mongoose from 'mongoose';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import ExamAttempt from '../models/ExamAttempt.js';
import User from '../models/User.js';

/**
 * Authorization helper:
 * Admin can access any report.
 * Teacher can only access reports for exams they created/own.
 */
export const canAccessExamReport = (exam, user) => {
  if (!exam || !user) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'teacher') return false;
  const creatorId = exam.createdBy?._id
    ? exam.createdBy._id.toString()
    : exam.createdBy?.toString();
  return creatorId === user._id.toString();
};

/**
 * 1. Get Exam Overview Report
 * Provides aggregate performance metrics and question accuracy summary.
 */
export const getExamOverviewReport = async (examId, user, filters = {}) => {
  if (!mongoose.Types.ObjectId.isValid(examId)) {
    const error = new Error('Invalid examination ID format');
    error.statusCode = 400;
    throw error;
  }

  const exam = await Exam.findById(examId).populate('createdBy', 'name email');
  if (!exam) {
    const error = new Error('Examination not found');
    error.statusCode = 404;
    throw error;
  }

  if (!canAccessExamReport(exam, user)) {
    const error = new Error('Access denied. You can only view reports for your own examinations.');
    error.statusCode = 403;
    throw error;
  }

  // Base match filter for attempts
  const attemptMatch = { exam: exam._id };

  // Date filtering
  if (filters.startDate || filters.endDate) {
    attemptMatch.createdAt = {};
    if (filters.startDate) {
      attemptMatch.createdAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      attemptMatch.createdAt.$lte = new Date(filters.endDate);
    }
  }

  if (filters.status && filters.status !== 'all') {
    attemptMatch.status = filters.status;
  }

  // Load all attempts matching filter
  const attempts = await ExamAttempt.find(attemptMatch).lean();
  const completedAttempts = attempts.filter((a) =>
    ['submitted', 'auto_submitted'].includes(a.status)
  );

  const totalAttempts = attempts.length;
  const completedCount = completedAttempts.length;
  const inProgressCount = attempts.filter((a) => a.status === 'in_progress').length;

  let averageScore = 0;
  let highestScore = 0;
  let lowestScore = 0;
  let passCount = 0;
  let failCount = 0;
  let passPercentage = 0;
  let averagePercentage = 0;
  let averageTimeTakenSeconds = 0;

  if (completedCount > 0) {
    const scores = completedAttempts.map((a) => a.score || 0);
    const sumScore = scores.reduce((acc, s) => acc + s, 0);
    averageScore = Math.round((sumScore / completedCount) * 100) / 100;
    highestScore = Math.max(...scores);
    lowestScore = Math.min(...scores);

    // Percentage calculations
    const percentages = completedAttempts.map((a) =>
      a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0
    );
    const sumPercentage = percentages.reduce((acc, p) => acc + p, 0);
    averagePercentage = Math.round((sumPercentage / completedCount) * 100) / 100;

    // Passing criteria: percentage >= 50%
    passCount = percentages.filter((p) => p >= 50).length;
    failCount = completedCount - passCount;
    passPercentage = Math.round((passCount / completedCount) * 10000) / 100;

    // Timing calculations
    const durationsSeconds = completedAttempts
      .filter((a) => a.startedAt && a.submittedAt)
      .map((a) => Math.max(0, (new Date(a.submittedAt) - new Date(a.startedAt)) / 1000));

    if (durationsSeconds.length > 0) {
      const sumDuration = durationsSeconds.reduce((acc, d) => acc + d, 0);
      averageTimeTakenSeconds = Math.round(sumDuration / durationsSeconds.length);
    }
  }

  // Load questions for question-wise summary
  const questions = await Question.find({ exam: exam._id }).sort({ order: 1 }).lean();

  const questionPerformance = questions.map((q) => {
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const optionDist = {};
    if (Array.isArray(q.options)) {
      q.options.forEach((opt) => {
        optionDist[opt] = 0;
      });
    }
    optionDist['unanswered'] = 0;

    completedAttempts.forEach((attempt) => {
      const ans = Array.isArray(attempt.answers)
        ? attempt.answers.find((a) => a.question && a.question.toString() === q._id.toString())
        : null;

      const isUnanswered =
        !ans ||
        ans.selectedAnswer === null ||
        ans.selectedAnswer === undefined ||
        (typeof ans.selectedAnswer === 'string' && ans.selectedAnswer.trim() === '') ||
        (Array.isArray(ans.selectedAnswer) && ans.selectedAnswer.length === 0);

      if (isUnanswered) {
        unansweredCount++;
        optionDist['unanswered']++;
      } else {
        if (Array.isArray(ans.selectedAnswer)) {
          ans.selectedAnswer.forEach((opt) => {
            const trimmed = String(opt).trim();
            if (optionDist[trimmed] !== undefined) {
              optionDist[trimmed]++;
            } else {
              optionDist[trimmed] = 1;
            }
          });
        } else {
          const choice = String(ans.selectedAnswer).trim();
          if (optionDist[choice] !== undefined) {
            optionDist[choice]++;
          } else {
            optionDist[choice] = 1;
          }
        }

        if (ans.marksAwarded > 0) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      }
    });

    const totalResponses = correctCount + incorrectCount + unansweredCount;
    const accuracyPercentage =
      totalResponses > 0 ? Math.round((correctCount / totalResponses) * 10000) / 100 : 0;

    return {
      questionId: q._id,
      questionType: q.questionType || 'SINGLE_CHOICE',
      order: q.order,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      correctAnswers: q.correctAnswers || [],
      acceptedAnswers: q.acceptedAnswers || [],
      marks: q.marks,
      totalResponses,
      correctResponses: correctCount,
      incorrectResponses: incorrectCount,
      unansweredResponses: unansweredCount,
      accuracyPercentage,
      optionDistribution: optionDist,
    };
  });

  return {
    exam: {
      _id: exam._id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      status: exam.status,
      startTime: exam.startTime,
      endTime: exam.endTime,
      createdBy: exam.createdBy,
    },
    statistics: {
      totalAttempts,
      completedAttempts: completedCount,
      inProgressAttempts: inProgressCount,
      averageScore,
      highestScore,
      lowestScore,
      passCount,
      failCount,
      passPercentage,
      averagePercentage,
      averageTimeTakenSeconds,
    },
    questionPerformance,
  };
};

/**
 * 2. Get Student Performance Report for an Exam
 * Returns per-student attempts with sorting, searching, and pagination.
 */
export const getExamStudentPerformance = async (examId, user, queryParams = {}) => {
  if (!mongoose.Types.ObjectId.isValid(examId)) {
    const error = new Error('Invalid examination ID format');
    error.statusCode = 400;
    throw error;
  }

  const exam = await Exam.findById(examId);
  if (!exam) {
    const error = new Error('Examination not found');
    error.statusCode = 404;
    throw error;
  }

  if (!canAccessExamReport(exam, user)) {
    const error = new Error('Access denied. You can only view reports for your own examinations.');
    error.statusCode = 403;
    throw error;
  }

  const {
    search = '',
    status = 'all',
    sortBy = 'submittedAt',
    sortOrder = 'desc',
    page = 1,
    limit = 50,
  } = queryParams;

  const attemptQuery = { exam: exam._id };
  if (status && status !== 'all') {
    attemptQuery.status = status;
  }

  // Load attempts with populated student
  const allAttempts = await ExamAttempt.find(attemptQuery)
    .populate('student', 'name email')
    .lean();

  // Get total question count for calculating unanswered
  const totalQuestionsCount = await Question.countDocuments({ exam: exam._id });

  // Map into enriched student performance objects
  let studentReports = allAttempts.map((attempt) => {
    const totalMarks = attempt.totalMarks || 0;
    const score = attempt.score || 0;
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;

    let correctCount = 0;
    let incorrectCount = 0;
    let answeredCount = 0;

    if (Array.isArray(attempt.answers)) {
      attempt.answers.forEach((ans) => {
        if (ans.selectedAnswer !== null && ans.selectedAnswer !== undefined && ans.selectedAnswer !== '') {
          answeredCount++;
          if (ans.marksAwarded > 0) {
            correctCount++;
          } else {
            incorrectCount++;
          }
        }
      });
    }

    const unansweredCount = Math.max(0, totalQuestionsCount - answeredCount);

    let timeTakenSeconds = null;
    if (attempt.startedAt && attempt.submittedAt) {
      timeTakenSeconds = Math.max(
        0,
        Math.round((new Date(attempt.submittedAt) - new Date(attempt.startedAt)) / 1000)
      );
    }

    return {
      attemptId: attempt._id,
      studentId: attempt.student?._id,
      studentName: attempt.student?.name || 'Unknown Student',
      studentEmail: attempt.student?.email || 'N/A',
      status: attempt.status,
      score,
      totalMarks,
      percentage,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      unansweredQuestions: unansweredCount,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      timeTakenSeconds,
    };
  });

  // Client-specified search filtering on student name / email
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    studentReports = studentReports.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) || s.studentEmail.toLowerCase().includes(q)
    );
  }

  // Sorting
  const orderMultiplier = sortOrder === 'asc' ? 1 : -1;
  studentReports.sort((a, b) => {
    if (sortBy === 'name') {
      return a.studentName.localeCompare(b.studentName) * orderMultiplier;
    }
    if (sortBy === 'score') {
      return (a.score - b.score) * orderMultiplier;
    }
    if (sortBy === 'percentage') {
      return (a.percentage - b.percentage) * orderMultiplier;
    }
    if (sortBy === 'timeTaken') {
      return ((a.timeTakenSeconds || 0) - (b.timeTakenSeconds || 0)) * orderMultiplier;
    }
    // Default to submission / start time
    const timeA = new Date(a.submittedAt || a.startedAt).getTime();
    const timeB = new Date(b.submittedAt || b.startedAt).getTime();
    return (timeA - timeB) * orderMultiplier;
  });

  // Pagination
  const total = studentReports.length;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const paginatedReports = studentReports.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return {
    examId: exam._id,
    examTitle: exam.title,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
    students: paginatedReports,
  };
};

/**
 * 3. Get Question Performance Breakdown
 */
export const getExamQuestionReport = async (examId, user) => {
  const overview = await getExamOverviewReport(examId, user);
  return {
    examId: overview.exam._id,
    examTitle: overview.exam.title,
    totalAttempts: overview.statistics.totalAttempts,
    completedAttempts: overview.statistics.completedAttempts,
    questions: overview.questionPerformance,
  };
};

/**
 * 4. Get Admin Overview Report (System-wide statistics)
 */
export const getAdminOverviewReport = async (filters = {}) => {
  const [totalStudents, totalTeachers, totalExams, totalAttempts] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    Exam.countDocuments(),
    ExamAttempt.countDocuments(),
  ]);

  // Aggregate completed attempt metrics
  const completedMatch = { status: { $in: ['submitted', 'auto_submitted'] } };
  if (filters.startDate || filters.endDate) {
    completedMatch.createdAt = {};
    if (filters.startDate) completedMatch.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) completedMatch.createdAt.$lte = new Date(filters.endDate);
  }

  const completedAttempts = await ExamAttempt.find(completedMatch).select('score totalMarks status').lean();
  const completedCount = completedAttempts.length;

  let averageScore = 0;
  let averagePercentage = 0;
  let passCount = 0;
  let failCount = 0;
  let passPercentage = 0;

  if (completedCount > 0) {
    const scores = completedAttempts.map((a) => a.score || 0);
    const sumScore = scores.reduce((acc, s) => acc + s, 0);
    averageScore = Math.round((sumScore / completedCount) * 100) / 100;

    const percentages = completedAttempts.map((a) =>
      a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0
    );
    const sumPercentage = percentages.reduce((acc, p) => acc + p, 0);
    averagePercentage = Math.round((sumPercentage / completedCount) * 100) / 100;

    passCount = percentages.filter((p) => p >= 50).length;
    failCount = completedCount - passCount;
    passPercentage = Math.round((passCount / completedCount) * 10000) / 100;
  }

  return {
    totalStudents,
    totalTeachers,
    totalExams,
    totalAttempts,
    completedAttempts: completedCount,
    averageScore,
    averagePercentage,
    passCount,
    failCount,
    passPercentage,
  };
};

/**
 * 5. Get Admin Exams Summary Report (Exam-level list with performance summaries)
 */
export const getAdminExamsReport = async (filters = {}) => {
  const examQuery = {};
  if (filters.status && filters.status !== 'all') {
    examQuery.status = filters.status;
  }
  if (filters.search) {
    examQuery.title = { $regex: filters.search.trim(), $options: 'i' };
  }

  const exams = await Exam.find(examQuery)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  const examIds = exams.map((e) => e._id);

  // Group attempts by exam
  const attemptStats = await ExamAttempt.aggregate([
    { $match: { exam: { $in: examIds } } },
    {
      $group: {
        _id: '$exam',
        totalAttempts: { $sum: 1 },
        completedAttempts: {
          $sum: {
            $cond: [{ $in: ['$status', ['submitted', 'auto_submitted']] }, 1, 0],
          },
        },
        scores: {
          $push: {
            $cond: [{ $in: ['$status', ['submitted', 'auto_submitted']] }, '$score', '$$REMOVE'],
          },
        },
        percentages: {
          $push: {
            $cond: [
              { $in: ['$status', ['submitted', 'auto_submitted']] },
              {
                $cond: [
                  { $gt: ['$totalMarks', 0] },
                  { $multiply: [{ $divide: ['$score', '$totalMarks'] }, 100] },
                  0,
                ],
              },
              '$$REMOVE',
            ],
          },
        },
      },
    },
  ]);

  const statsMap = {};
  attemptStats.forEach((stat) => {
    const completed = stat.completedAttempts || 0;
    let avgScore = 0;
    let highScore = 0;
    let lowScore = 0;
    let avgPercent = 0;
    let passCount = 0;
    let passPercent = 0;

    if (completed > 0 && Array.isArray(stat.scores) && stat.scores.length > 0) {
      const sumScore = stat.scores.reduce((a, b) => a + b, 0);
      avgScore = Math.round((sumScore / completed) * 100) / 100;
      highScore = Math.max(...stat.scores);
      lowScore = Math.min(...stat.scores);

      if (Array.isArray(stat.percentages)) {
        const sumPercent = stat.percentages.reduce((a, b) => a + b, 0);
        avgPercent = Math.round((sumPercent / completed) * 100) / 100;
        passCount = stat.percentages.filter((p) => p >= 50).length;
        passPercent = Math.round((passCount / completed) * 10000) / 100;
      }
    }

    statsMap[stat._id.toString()] = {
      totalAttempts: stat.totalAttempts,
      completedAttempts: completed,
      averageScore: avgScore,
      highestScore: highScore,
      lowestScore: lowScore,
      averagePercentage: avgPercent,
      passPercentage: passPercent,
    };
  });

  const reports = exams.map((exam) => {
    const stats = statsMap[exam._id.toString()] || {
      totalAttempts: 0,
      completedAttempts: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      averagePercentage: 0,
      passPercentage: 0,
    };

    return {
      examId: exam._id,
      title: exam.title,
      status: exam.status,
      duration: exam.duration,
      createdAt: exam.createdAt,
      teacher: {
        _id: exam.createdBy?._id,
        name: exam.createdBy?.name || 'Unknown',
        email: exam.createdBy?.email || 'N/A',
      },
      ...stats,
    };
  });

  return reports;
};

/**
 * 6. Get Teacher's Exams Reports Overview
 * Summary of all exams created by this teacher.
 */
export const getTeacherExamsReport = async (teacherId, filters = {}) => {
  const examQuery = { createdBy: teacherId };
  if (filters.status && filters.status !== 'all') {
    examQuery.status = filters.status;
  }
  if (filters.search) {
    examQuery.title = { $regex: filters.search.trim(), $options: 'i' };
  }

  const exams = await Exam.find(examQuery).sort({ createdAt: -1 }).lean();
  const examIds = exams.map((e) => e._id);

  // Group attempts
  const attemptStats = await ExamAttempt.aggregate([
    { $match: { exam: { $in: examIds } } },
    {
      $group: {
        _id: '$exam',
        totalAttempts: { $sum: 1 },
        completedAttempts: {
          $sum: {
            $cond: [{ $in: ['$status', ['submitted', 'auto_submitted']] }, 1, 0],
          },
        },
        scores: {
          $push: {
            $cond: [{ $in: ['$status', ['submitted', 'auto_submitted']] }, '$score', '$$REMOVE'],
          },
        },
        percentages: {
          $push: {
            $cond: [
              { $in: ['$status', ['submitted', 'auto_submitted']] },
              {
                $cond: [
                  { $gt: ['$totalMarks', 0] },
                  { $multiply: [{ $divide: ['$score', '$totalMarks'] }, 100] },
                  0,
                ],
              },
              '$$REMOVE',
            ],
          },
        },
      },
    },
  ]);

  const statsMap = {};
  let totalPlatformAttempts = 0;
  let totalCompleted = 0;
  let cumulativeScore = 0;

  attemptStats.forEach((stat) => {
    const completed = stat.completedAttempts || 0;
    let avgScore = 0;
    let highScore = 0;
    let lowScore = 0;
    let avgPercent = 0;
    let passCount = 0;
    let passPercent = 0;

    if (completed > 0 && Array.isArray(stat.scores) && stat.scores.length > 0) {
      const sumScore = stat.scores.reduce((a, b) => a + b, 0);
      avgScore = Math.round((sumScore / completed) * 100) / 100;
      highScore = Math.max(...stat.scores);
      lowScore = Math.min(...stat.scores);
      cumulativeScore += sumScore;

      if (Array.isArray(stat.percentages)) {
        const sumPercent = stat.percentages.reduce((a, b) => a + b, 0);
        avgPercent = Math.round((sumPercent / completed) * 100) / 100;
        passCount = stat.percentages.filter((p) => p >= 50).length;
        passPercent = Math.round((passCount / completed) * 10000) / 100;
      }
    }

    totalPlatformAttempts += stat.totalAttempts || 0;
    totalCompleted += completed;

    statsMap[stat._id.toString()] = {
      totalAttempts: stat.totalAttempts,
      completedAttempts: completed,
      averageScore: avgScore,
      highestScore: highScore,
      lowestScore: lowScore,
      averagePercentage: avgPercent,
      passPercentage: passPercent,
    };
  });

  const reports = exams.map((exam) => {
    const stats = statsMap[exam._id.toString()] || {
      totalAttempts: 0,
      completedAttempts: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      averagePercentage: 0,
      passPercentage: 0,
    };

    return {
      examId: exam._id,
      title: exam.title,
      status: exam.status,
      duration: exam.duration,
      createdAt: exam.createdAt,
      ...stats,
    };
  });

  const overallAvgScore =
    totalCompleted > 0 ? Math.round((cumulativeScore / totalCompleted) * 100) / 100 : 0;

  return {
    summary: {
      totalExams: exams.length,
      totalAttempts: totalPlatformAttempts,
      completedAttempts: totalCompleted,
      averageScore: overallAvgScore,
    },
    exams: reports,
  };
};

export default {
  canAccessExamReport,
  getExamOverviewReport,
  getExamStudentPerformance,
  getExamQuestionReport,
  getAdminOverviewReport,
  getAdminExamsReport,
  getTeacherExamsReport,
};
