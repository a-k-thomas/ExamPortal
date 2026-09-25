import mongoose from 'mongoose';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import ExamAttempt from '../models/ExamAttempt.js';
import { evaluateAttempt } from '../services/evaluationService.js';
import { calculateAttemptDeadline, isAttemptExpired } from '../services/attemptTimingService.js';

/**
 * Helper: Project question into student-safe object.
 * NEVER exposes correctAnswer under any circumstances.
 */
const toStudentSafeQuestion = (q) => ({
  _id: q._id,
  questionText: q.questionText,
  questionType: q.questionType || 'SINGLE_CHOICE',
  options: q.options || [],
  marks: q.marks,
  order: q.order,
});

/**
 * Helper: Build the safe attempt shape included in all student responses.
 * Always includes deadline metadata; never includes correctAnswer.
 */
const toSafeAttemptResponse = (attempt, exam) => {
  const deadline = calculateAttemptDeadline(attempt, exam);
  return {
    _id: attempt._id,
    exam: attempt.exam,
    student: attempt.student,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt ?? null,
    score: attempt.score,
    totalMarks: attempt.totalMarks,
    deadline,
  };
};

// ─── A. GET /api/attempts/available-exams (getAvailableExams) ─────────────────
// Student-facing: list published exams currently within permitted window
export const getAvailableExams = async (req, res) => {
  try {
    const now = new Date();

    // Query: published, active window, not archived
    const exams = await Exam.find({
      status: 'published',
      startTime: { $lte: now },
      endTime: { $gte: now },
    })
      .select('title description instructions duration startTime endTime status createdAt')
      .sort({ startTime: 1 });

    if (exams.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        exams: [],
      });
    }

    // Attach totalMarks and questionCount for each exam
    const examIds = exams.map((e) => e._id);
    const questionStats = await Question.aggregate([
      { $match: { exam: { $in: examIds } } },
      {
        $group: {
          _id: '$exam',
          count: { $sum: 1 },
          totalMarks: { $sum: '$marks' },
        },
      },
    ]);

    const statsMap = {};
    questionStats.forEach((stat) => {
      statsMap[stat._id.toString()] = {
        questionCount: stat.count,
        totalMarks: stat.totalMarks,
      };
    });

    // Check existing student attempts for these exams if student is authenticated
    let studentAttemptsMap = {};
    if (req.user && req.user._id) {
      const attempts = await ExamAttempt.find({
        student: req.user._id,
        exam: { $in: examIds },
      }).select('exam status startedAt submittedAt');

      attempts.forEach((att) => {
        studentAttemptsMap[att.exam.toString()] = {
          attemptId: att._id,
          status: att.status,
          startedAt: att.startedAt,
          submittedAt: att.submittedAt,
        };
      });
    }

    // Map into student-safe response (only exams with >= 1 question)
    const availableExams = exams
      .map((exam) => {
        const stats = statsMap[exam._id.toString()] || { questionCount: 0, totalMarks: 0 };
        const studentAttempt = studentAttemptsMap[exam._id.toString()] || null;

        return {
          _id: exam._id,
          title: exam.title,
          description: exam.description,
          instructions: exam.instructions,
          duration: exam.duration,
          startTime: exam.startTime,
          endTime: exam.endTime,
          status: exam.status,
          questionCount: stats.questionCount,
          totalMarks: stats.totalMarks,
          studentAttempt,
        };
      })
      .filter((exam) => exam.questionCount > 0); // only exams with at least 1 question

    return res.status(200).json({
      success: true,
      count: availableExams.length,
      exams: availableExams,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve available examinations.',
    });
  }
};

// ─── B. POST /api/attempts/exams/:examId/start (startAttempt) ─────────────────
// Student-only: start an exam or resume an existing in-progress attempt.
// Phase 5B: startedAt is always server-set. Deadline is recalculated server-side.
//           An expired in-progress attempt is auto-evaluated before responding.
export const startAttempt = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid examination ID format.',
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Examination not found.',
      });
    }

    // Rule: Exam must be published
    if (exam.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'This examination is not published and cannot be started.',
      });
    }

    // Rule: Current server time must be within exam window
    const now = new Date();
    if (now < new Date(exam.startTime)) {
      return res.status(400).json({
        success: false,
        message: `Examination window has not opened yet. It will open at ${new Date(exam.startTime).toLocaleString()}.`,
      });
    }

    if (now > new Date(exam.endTime)) {
      return res.status(400).json({
        success: false,
        message: `Examination window has expired. It closed at ${new Date(exam.endTime).toLocaleString()}.`,
      });
    }

    // Rule: Exam must contain at least one question
    const questions = await Question.find({ exam: exam._id }).sort({ order: 1, createdAt: 1 });
    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This examination does not contain any questions yet and cannot be started.',
      });
    }

    // Check if student already has an attempt
    const existingAttempt = await ExamAttempt.findOne({
      exam: exam._id,
      student: req.user._id,
    });

    if (existingAttempt) {
      // If already fully submitted, prevent restart
      if (['submitted', 'auto_submitted'].includes(existingAttempt.status)) {
        return res.status(400).json({
          success: false,
          message: 'You have already completed and submitted this examination.',
          attemptId: existingAttempt._id,
          status: existingAttempt.status,
          submittedAt: existingAttempt.submittedAt,
        });
      }

      // Phase 5B: If the in-progress attempt has expired, auto-evaluate it now.
      // Do NOT reset startedAt — deadline is from original start.
      if (isAttemptExpired(existingAttempt, exam, now)) {
        const { attempt: evaluated } = await evaluateAttempt(existingAttempt._id, {
          status: 'auto_submitted',
          submittedAt: now,
        });
        return res.status(200).json({
          success: true,
          expired: true,
          message: 'Your examination time has expired. The attempt has been automatically submitted.',
          attempt: toSafeAttemptResponse(evaluated, exam),
          exam: {
            _id: exam._id,
            title: exam.title,
            duration: exam.duration,
            startTime: exam.startTime,
            endTime: exam.endTime,
          },
        });
      }

      // Resume existing in-progress attempt safely.
      // Do NOT reset startedAt — deadline is from original start.
      return res.status(200).json({
        success: true,
        message: 'Resuming existing in-progress examination attempt.',
        resumed: true,
        attempt: {
          ...toSafeAttemptResponse(existingAttempt, exam),
          answers: existingAttempt.answers,
        },
        exam: {
          _id: exam._id,
          title: exam.title,
          description: exam.description,
          instructions: exam.instructions,
          duration: exam.duration,
          startTime: exam.startTime,
          endTime: exam.endTime,
        },
        questions: questions.map(toStudentSafeQuestion),
      });
    }

    // New attempt — startedAt is always set by the server, never from req.body
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const initialAnswers = questions.map((q) => ({
      question: q._id,
      selectedAnswer: null,
      marksAwarded: 0,
    }));

    const newAttempt = await ExamAttempt.create({
      exam: exam._id,
      student: req.user._id,   // strictly server-derived
      totalMarks,               // strictly server-derived
      score: 0,
      startedAt: now,           // always server time — never from client
      status: 'in_progress',
      answers: initialAnswers,
    });

    return res.status(201).json({
      success: true,
      message: 'Examination attempt started successfully.',
      resumed: false,
      attempt: {
        ...toSafeAttemptResponse(newAttempt, exam),
        answers: newAttempt.answers,
      },
      exam: {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        instructions: exam.instructions,
        duration: exam.duration,
        startTime: exam.startTime,
        endTime: exam.endTime,
      },
      questions: questions.map(toStudentSafeQuestion),
    });
  } catch (error) {
    // Handle rare race condition: concurrent start requests producing duplicate key
    if (error.code === 11000) {
      const raceAttempt = await ExamAttempt.findOne({
        exam: req.params.examId,
        student: req.user._id,
      });
      if (raceAttempt) {
        const exam = await Exam.findById(req.params.examId);
        return res.status(200).json({
          success: true,
          message: 'Resuming existing in-progress examination attempt.',
          resumed: true,
          attempt: exam ? toSafeAttemptResponse(raceAttempt, exam) : raceAttempt,
        });
      }
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to start examination attempt.',
    });
  }
};

// ─── C. GET /api/attempts/:id (getMyAttempt) ──────────────────────────────────
// Student-only: fetch details of an attempt belonging to the authenticated student.
// Phase 5B: If the attempt is in_progress and past its server deadline,
//           it is auto-evaluated to auto_submitted before the response is sent.
export const getMyAttempt = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attempt ID format.',
      });
    }

    const attempt = await ExamAttempt.findById(id);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Examination attempt not found.',
      });
    }

    // Authorization: student can only view their own attempt
    if (attempt.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own examination attempts.',
      });
    }

    const exam = await Exam.findById(attempt.exam).select(
      'title description instructions duration startTime endTime status'
    );
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Associated examination not found.',
      });
    }

    const now = new Date();

    // Phase 5B: auto-evaluate expired in_progress attempts on retrieval.
    // A student refreshing after time expires must get a locked response.
    let activeAttempt = attempt;
    if (attempt.status === 'in_progress' && isAttemptExpired(attempt, exam, now)) {
      const { attempt: evaluated } = await evaluateAttempt(attempt._id, {
        status: 'auto_submitted',
        submittedAt: now,
      });
      activeAttempt = evaluated;
    }

    // Retrieve questions and project to student-safe structure (strip correctAnswer)
    const questions = await Question.find({ exam: exam._id }).sort({ order: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      attempt: {
        ...toSafeAttemptResponse(activeAttempt, exam),
        answers: activeAttempt.answers,
      },
      exam,
      questions: questions.map(toStudentSafeQuestion),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve examination attempt.',
    });
  }
};

// ─── D. PATCH /api/attempts/:id/answer (saveAnswer) ──────────────────────────
// Student-only: save or update a single answer during an in_progress attempt.
// Phase 5B: If deadline has passed when this request arrives:
//   - DO NOT save the late answer.
//   - Auto-evaluate the attempt and return a locked response.
export const saveAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionId, selectedAnswer } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attempt ID format.',
      });
    }

    if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid question ID is required.',
      });
    }

    const attempt = await ExamAttempt.findById(id);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Examination attempt not found.',
      });
    }

    // Rule: Must belong to authenticated student
    if (attempt.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own attempts.',
      });
    }

    // Rule: Must be in_progress
    if (attempt.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Cannot modify answers for an attempt that is already ${attempt.status}.`,
      });
    }

    // Load exam for deadline calculation
    const exam = await Exam.findById(attempt.exam);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Associated examination not found.',
      });
    }

    const now = new Date();

    // Phase 5B: If deadline has passed — auto-submit and reject the late answer.
    // The late answer is NEVER persisted.
    if (isAttemptExpired(attempt, exam, now)) {
      const { attempt: evaluated, alreadySubmitted } = await evaluateAttempt(attempt._id, {
        status: 'auto_submitted',
        submittedAt: now,
      });
      return res.status(410).json({
        success: false,
        code: 'ATTEMPT_EXPIRED',
        message: 'The examination time limit has expired. This attempt has been automatically submitted.',
        alreadySubmitted,
        attempt: toSafeAttemptResponse(evaluated, exam),
      });
    }

    // Verify question belongs to this exam
    const question = await Question.findOne({ _id: questionId, exam: exam._id });
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found in this examination.',
      });
    }

    // Validate selectedAnswer per question type
    let normalizedAnswer = null;
    const qType = question.questionType || 'SINGLE_CHOICE';

    if (selectedAnswer !== undefined && selectedAnswer !== null) {
      if (qType === 'SINGLE_CHOICE') {
        const trimmed = String(selectedAnswer).trim();
        if (trimmed !== '') {
          const validOptions = (question.options || []).map((opt) => opt.trim());
          if (!validOptions.includes(trimmed)) {
            return res.status(400).json({
              success: false,
              message: 'Selected answer must be one of the valid options for this question.',
            });
          }
          normalizedAnswer = trimmed;
        }
      } else if (qType === 'TRUE_FALSE') {
        let valStr = '';
        if (typeof selectedAnswer === 'boolean') {
          valStr = selectedAnswer ? 'True' : 'False';
        } else {
          const lower = String(selectedAnswer).trim().toLowerCase();
          if (lower === 'true') valStr = 'True';
          else if (lower === 'false') valStr = 'False';
          else if (lower !== '') {
            return res.status(400).json({
              success: false,
              message: 'Selected answer for True/False question must be "True" or "False".',
            });
          }
        }
        normalizedAnswer = valStr || null;
      } else if (qType === 'MULTIPLE_SELECT') {
        let list = [];
        if (Array.isArray(selectedAnswer)) {
          list = selectedAnswer;
        } else if (typeof selectedAnswer === 'string') {
          const trimmed = selectedAnswer.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) list = parsed;
            } catch {
              list = [trimmed];
            }
          } else if (trimmed !== '') {
            list = [trimmed];
          }
        }
        if (list.length > 0) {
          const validOptions = (question.options || []).map((opt) => opt.trim());
          const trimmedList = list.map((opt) => String(opt).trim()).filter(Boolean);
          const invalidItems = trimmedList.filter((opt) => !validOptions.includes(opt));
          if (invalidItems.length > 0) {
            return res.status(400).json({
              success: false,
              message: 'Selected answers must be valid options for this question.',
            });
          }
          normalizedAnswer = Array.from(new Set(trimmedList)).sort();
        }
      } else if (qType === 'SHORT_ANSWER') {
        if (typeof selectedAnswer !== 'string' && typeof selectedAnswer !== 'number') {
          return res.status(400).json({
            success: false,
            message: 'Selected answer for short answer question must be a string.',
          });
        }
        const trimmed = String(selectedAnswer).trim();
        normalizedAnswer = trimmed !== '' ? String(selectedAnswer) : null;
      }
    }

    // Update or insert answer (never trusting client marksAwarded)
    const existingAnswerIndex = attempt.answers.findIndex(
      (a) => a.question.toString() === questionId.toString()
    );

    if (existingAnswerIndex !== -1) {
      attempt.answers[existingAnswerIndex].selectedAnswer = normalizedAnswer;
      if (Array.isArray(normalizedAnswer)) {
        attempt.answers[existingAnswerIndex].selectedAnswers = normalizedAnswer;
      }
      // marksAwarded is always recalculated server-side on evaluation — never touched here
    } else {
      attempt.answers.push({
        question: question._id,
        selectedAnswer: normalizedAnswer,
        selectedAnswers: Array.isArray(normalizedAnswer) ? normalizedAnswer : [],
        marksAwarded: 0,
      });
    }

    await attempt.save();

    const deadline = calculateAttemptDeadline(attempt, exam);

    return res.status(200).json({
      success: true,
      message: 'Answer saved successfully.',
      answer: {
        questionId: question._id,
        selectedAnswer: normalizedAnswer,
      },
      deadline,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to save answer.',
    });
  }
};

// ─── E. POST /api/attempts/:id/submit (submitAttempt) ─────────────────────────
// Student-only: submit an in-progress attempt.
// Phase 5A: delegates authoritative evaluation/scoring to evaluationService.
// Phase 5B: server determines status ('submitted' vs 'auto_submitted') based on deadline.
//           A client CANNOT force 'submitted' after the deadline.
export const submitAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attempt ID format.',
      });
    }

    const attempt = await ExamAttempt.findById(id);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Examination attempt not found.',
      });
    }

    // Rule: Must belong to authenticated student
    if (attempt.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only submit your own attempts.',
      });
    }

    // Idempotency: already submitted — return stored score without recalculating
    if (['submitted', 'auto_submitted'].includes(attempt.status)) {
      const exam = await Exam.findById(attempt.exam).select(
        'duration endTime startTime title'
      );
      return res.status(200).json({
        success: true,
        message: 'Examination attempt was already submitted.',
        alreadySubmitted: true,
        attempt: exam
          ? toSafeAttemptResponse(attempt, exam)
          : {
              _id: attempt._id,
              exam: attempt.exam,
              student: attempt.student,
              status: attempt.status,
              startedAt: attempt.startedAt,
              submittedAt: attempt.submittedAt,
              score: attempt.score,
              totalMarks: attempt.totalMarks,
            },
      });
    }

    // Load exam for deadline check
    const exam = await Exam.findById(attempt.exam);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Associated examination not found.',
      });
    }

    const now = new Date();

    // Phase 5B: Server decides the final status.
    // If deadline has passed: status = auto_submitted, final answers batch ignored.
    // If within deadline:     status = submitted,      final answers batch honoured.
    let finalStatus;
    let finalAnswers;

    if (isAttemptExpired(attempt, exam, now)) {
      // Past deadline — server overrides any client-requested status.
      // Late final-answers batch is NEVER accepted.
      finalStatus = 'auto_submitted';
      finalAnswers = []; // ignore any client-provided batch
    } else {
      finalStatus = 'submitted';
      finalAnswers = Array.isArray(answers) ? answers : [];
    }

    // Delegate authoritative scoring to evaluationService.
    // evaluateAttempt merges finalAnswers, validates against DB options,
    // computes score/totalMarks from Question.correctAnswer, and saves.
    const { attempt: evaluated } = await evaluateAttempt(attempt._id, {
      finalAnswers,
      status: finalStatus,
      submittedAt: now,
    });

    const message =
      finalStatus === 'auto_submitted'
        ? 'Examination time had expired. Attempt automatically submitted and evaluated.'
        : 'Examination attempt submitted and evaluated successfully.';

    return res.status(200).json({
      success: true,
      message,
      alreadySubmitted: false,
      attempt: toSafeAttemptResponse(evaluated, exam),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit examination attempt.',
    });
  }
};

// ─── F. GET /api/attempts/:id/result (getAttemptResult) ───────────────────────
// Student-only: fetch evaluated result for a submitted or auto_submitted attempt.
export const getAttemptResult = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attempt ID format.',
      });
    }

    const attempt = await ExamAttempt.findById(id);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Examination attempt not found.',
      });
    }

    // Rule: Must belong to authenticated student
    if (attempt.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own examination results.',
      });
    }

    // Rule: Available only when submitted or auto_submitted
    if (attempt.status === 'in_progress') {
      return res.status(409).json({
        success: false,
        code: 'RESULT_NOT_AVAILABLE',
        message: 'Examination result is not available while attempt is in progress.',
      });
    }

    const exam = await Exam.findById(attempt.exam).select('title duration');
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Associated examination not found.',
      });
    }

    // Calculate percentage server-side
    let percentage = 0;
    if (attempt.totalMarks > 0) {
      percentage = Math.round((attempt.score / attempt.totalMarks) * 10000) / 100;
    }

    // Fetch canonical questions for question-by-question review
    const questions = await Question.find({ exam: attempt.exam }).sort({ order: 1, createdAt: 1 });

    const questionReview = questions.map((q, idx) => {
      const studentAnswerDoc = (attempt.answers || []).find(
        (a) => (a.question?._id ? a.question._id.toString() : a.question?.toString()) === q._id.toString()
      );
      const studentAnswer = studentAnswerDoc ? studentAnswerDoc.selectedAnswer : null;
      const marksAwarded = studentAnswerDoc ? Number(studentAnswerDoc.marksAwarded) || 0 : 0;
      const maxMarks = Number(q.marks) || 0;
      const qType = q.questionType || 'SINGLE_CHOICE';

      // Determine if student left the question unanswered
      let isUnanswered = false;
      if (studentAnswer === null || studentAnswer === undefined) {
        isUnanswered = true;
      } else if (qType === 'MULTIPLE_SELECT') {
        isUnanswered = !Array.isArray(studentAnswer) || studentAnswer.length === 0;
      } else if (typeof studentAnswer === 'string') {
        isUnanswered = studentAnswer.trim() === '';
      }

      // Exact correctness based on canonical server-side scoring
      const isCorrect = !isUnanswered && marksAwarded > 0 && marksAwarded === maxMarks;
      const status = isUnanswered ? 'UNANSWERED' : (isCorrect ? 'CORRECT' : 'INCORRECT');

      // Canonical formatted correct answer representation
      let formattedCorrectAnswer = q.correctAnswer || '';
      if (qType === 'MULTIPLE_SELECT') {
        formattedCorrectAnswer = (Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0)
          ? q.correctAnswers.join(', ')
          : (q.correctAnswer || '');
      } else if (qType === 'SHORT_ANSWER') {
        formattedCorrectAnswer = (Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length > 0)
          ? q.acceptedAnswers.join(' / ')
          : (q.correctAnswer || '');
      }

      return {
        questionId: q._id,
        question: q.questionText,
        questionText: q.questionText,
        questionType: qType,
        options: q.options || [],
        studentAnswer: isUnanswered ? null : studentAnswer,
        correctAnswer: formattedCorrectAnswer,
        correctAnswers: q.correctAnswers || [],
        acceptedAnswers: q.acceptedAnswers || [],
        isCorrect,
        isUnanswered,
        status,
        marksAwarded,
        maxMarks,
        marks: maxMarks,
        explanation: q.explanation || '',
        order: q.order !== undefined ? q.order : idx + 1,
      };
    });

    return res.status(200).json({
      success: true,
      result: {
        attemptId: attempt._id,
        examId: exam._id,
        examTitle: exam.title,
        status: attempt.status,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        duration: exam.duration,
        questions: questionReview,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve examination result.',
    });
  }
};

// ─── G. GET /api/attempts/my-attempts (getMyAttempts) ─────────────────────────
// Student-only: list all examination attempts made by the authenticated student
export const getMyAttempts = async (req, res) => {
  try {
    const attempts = await ExamAttempt.find({ student: req.user._id })
      .populate('exam', 'title duration')
      .sort({ createdAt: -1 });

    const safeAttempts = attempts.map((a) => {
      const totalMarks = a.totalMarks || 0;
      const score = a.score || 0;
      const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;

      return {
        attemptId: a._id,
        examId: a.exam?._id,
        examTitle: a.exam?.title || 'Unknown Examination',
        duration: a.exam?.duration,
        status: a.status,
        score,
        totalMarks,
        percentage,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
      };
    });

    return res.status(200).json({
      success: true,
      count: safeAttempts.length,
      attempts: safeAttempts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve examination attempts.',
    });
  }
};


