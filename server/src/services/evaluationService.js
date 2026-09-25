import mongoose from 'mongoose';
import ExamAttempt from '../models/ExamAttempt.js';
import Question from '../models/Question.js';

/**
 * Helper: Normalize and sanitize a student answer according to question type
 */
export const normalizeAnswerForQuestion = (question, answer) => {
  if (answer === undefined || answer === null) return null;
  const qType = question.questionType || 'SINGLE_CHOICE';

  if (qType === 'SINGLE_CHOICE') {
    if (typeof answer !== 'string') return null;
    const trimmed = answer.trim();
    if (!trimmed) return null;
    const validOptions = (question.options || []).map((o) => String(o).trim());
    return validOptions.includes(trimmed) ? trimmed : null;
  }

  if (qType === 'TRUE_FALSE') {
    if (typeof answer === 'boolean') {
      return answer ? 'True' : 'False';
    }
    if (typeof answer === 'string') {
      const lower = answer.trim().toLowerCase();
      if (lower === 'true') return 'True';
      if (lower === 'false') return 'False';
    }
    return null;
  }

  if (qType === 'MULTIPLE_SELECT') {
    let list = [];
    if (Array.isArray(answer)) {
      list = answer;
    } else if (typeof answer === 'string') {
      const trimmed = answer.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) list = parsed;
        } catch {
          list = [trimmed];
        }
      } else if (trimmed) {
        list = [trimmed];
      }
    }
    if (list.length === 0) return null;
    const validOptions = (question.options || []).map((o) => String(o).trim());
    const validSelections = list
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item && validOptions.includes(item));
    const deduped = Array.from(new Set(validSelections)).sort();
    return deduped.length > 0 ? deduped : null;
  }

  if (qType === 'SHORT_ANSWER') {
    if (typeof answer !== 'string') return null;
    const trimmed = answer.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
};

/**
 * Authoritative Server-Side Evaluation Service
 *
 * Evaluates an examination attempt by comparing selected answers against
 * the canonical Question fields stored in MongoDB.
 *
 * Supported Question Types:
 * 1. SINGLE_CHOICE: Exact match against question.correctAnswer
 * 2. MULTIPLE_SELECT: Exact set match against question.correctAnswers (order-insensitive, no partial credit)
 * 3. TRUE_FALSE: Exact match against normalized "True" / "False"
 * 4. SHORT_ANSWER: Normalized text comparison against acceptedAnswers (trimmed, collapsed whitespace, case-insensitive)
 *
 * Evaluation Rules:
 * - Server-authoritative: client-provided marksAwarded/isCorrect are strictly ignored.
 * - Correct: marksAwarded = question.marks
 * - Incorrect / Unanswered / Empty / Null: marksAwarded = 0
 * - score = sum of marksAwarded
 * - totalMarks = sum of question.marks from MongoDB (never from client)
 * - Idempotent: Already submitted / auto_submitted attempts are not re-evaluated
 * - Correct answers are NEVER exposed in the evaluation return payload
 *
 * @param {string|mongoose.Types.ObjectId} attemptId
 * @param {Object} options
 * @param {Array} [options.finalAnswers] - Optional final batch of { questionId, selectedAnswer }
 * @param {'submitted'|'auto_submitted'} [options.status='submitted']
 * @param {Date} [options.submittedAt]
 * @returns {Promise<{ alreadySubmitted: boolean, attempt: Object }>}
 */
export const evaluateAttempt = async (attemptId, options = {}) => {
  if (!mongoose.Types.ObjectId.isValid(attemptId)) {
    const error = new Error('Invalid attempt ID format.');
    error.statusCode = 400;
    throw error;
  }

  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) {
    const error = new Error('Examination attempt not found.');
    error.statusCode = 404;
    throw error;
  }

  // Idempotency: If attempt was already submitted or auto_submitted, do NOT recalculate
  if (['submitted', 'auto_submitted'].includes(attempt.status)) {
    return {
      alreadySubmitted: true,
      attempt,
    };
  }

  // Fetch all canonical questions belonging to the exam from MongoDB
  const questions = await Question.find({ exam: attempt.exam }).sort({ order: 1, createdAt: 1 });
  if (questions.length === 0) {
    const error = new Error('Associated examination has no questions to evaluate.');
    error.statusCode = 400;
    throw error;
  }

  // Map previously saved answers by question ID
  const answersMap = new Map();
  if (Array.isArray(attempt.answers)) {
    attempt.answers.forEach((ans) => {
      const qId = ans.question?._id ? ans.question._id.toString() : ans.question?.toString();
      if (qId) {
        answersMap.set(qId, ans.selectedAnswer !== undefined ? ans.selectedAnswer : null);
      }
    });
  }

  // Apply finalAnswers batch if provided (sanitizing input against valid options / types)
  if (Array.isArray(options.finalAnswers) && options.finalAnswers.length > 0) {
    const questionLookup = new Map();
    questions.forEach((q) => questionLookup.set(q._id.toString(), q));

    for (const item of options.finalAnswers) {
      if (!item.questionId || !mongoose.Types.ObjectId.isValid(item.questionId)) continue;
      const qId = item.questionId.toString();
      const questionDoc = questionLookup.get(qId);
      if (!questionDoc) continue;

      const normalizedAnswer = normalizeAnswerForQuestion(questionDoc, item.selectedAnswer);
      answersMap.set(qId, normalizedAnswer);
    }
  }

  // Authoritative server-side evaluation loop
  let calculatedScore = 0;
  let calculatedTotalMarks = 0;
  const evaluatedAnswers = [];

  for (const question of questions) {
    const questionMarks = Number(question.marks) || 0;
    calculatedTotalMarks += questionMarks;

    const qId = question._id.toString();
    const qType = question.questionType || 'SINGLE_CHOICE';
    const studentChoice = answersMap.get(qId) ?? null;

    let marksAwarded = 0;

    if (studentChoice !== null && studentChoice !== undefined) {
      // 1. SINGLE_CHOICE
      if (qType === 'SINGLE_CHOICE') {
        const trimmedChoice = String(studentChoice).trim();
        const canonicalAnswer = String(question.correctAnswer || '').trim();
        if (trimmedChoice !== '' && trimmedChoice === canonicalAnswer) {
          marksAwarded = questionMarks;
        }
      }

      // 2. TRUE_FALSE
      else if (qType === 'TRUE_FALSE') {
        const choiceStr = String(studentChoice).trim().toLowerCase();
        const canonical = String(question.correctAnswer || '').trim().toLowerCase();
        if (choiceStr !== '' && choiceStr === canonical && (choiceStr === 'true' || choiceStr === 'false')) {
          marksAwarded = questionMarks;
        }
      }

      // 3. MULTIPLE_SELECT (Exact matching set, order-normalized, no partial marks)
      else if (qType === 'MULTIPLE_SELECT') {
        const correctList = Array.isArray(question.correctAnswers) && question.correctAnswers.length > 0
          ? question.correctAnswers
          : question.correctAnswer ? [question.correctAnswer] : [];
        const correctSet = correctList.map((a) => String(a).trim()).filter(Boolean).sort();

        let studentSet = [];
        if (Array.isArray(studentChoice)) {
          studentSet = studentChoice.map((a) => String(a).trim()).filter(Boolean).sort();
        } else if (typeof studentChoice === 'string' && studentChoice.trim()) {
          studentSet = [studentChoice.trim()];
        }

        if (
          correctSet.length > 0 &&
          correctSet.length === studentSet.length &&
          correctSet.every((val, idx) => val === studentSet[idx])
        ) {
          marksAwarded = questionMarks;
        }
      }

      // 4. SHORT_ANSWER (Case-insensitive, collapsed repeated whitespace, trimmed)
      else if (qType === 'SHORT_ANSWER') {
        const normalizeText = (str) =>
          String(str || '')
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase();

        const normalizedStudent = normalizeText(studentChoice);

        const acceptedList = Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length > 0
          ? question.acceptedAnswers
          : question.correctAnswer ? [question.correctAnswer] : [];

        const normalizedAccepted = acceptedList.map(normalizeText).filter(Boolean);

        if (normalizedStudent !== '' && normalizedAccepted.includes(normalizedStudent)) {
          marksAwarded = questionMarks;
        }
      }
    }

    calculatedScore += marksAwarded;

    evaluatedAnswers.push({
      question: question._id,
      selectedAnswer: studentChoice,
      selectedAnswers: Array.isArray(studentChoice) ? studentChoice : undefined,
      marksAwarded,
    });
  }

  // Update and save attempt atomically
  const finalStatus = options.status === 'auto_submitted' ? 'auto_submitted' : 'submitted';
  const submissionTime = options.submittedAt || new Date();

  attempt.answers = evaluatedAnswers;
  attempt.score = calculatedScore;
  attempt.totalMarks = calculatedTotalMarks; // Authoritative from DB Question documents
  attempt.status = finalStatus;
  attempt.submittedAt = submissionTime;

  await attempt.save();

  return {
    alreadySubmitted: false,
    attempt,
  };
};

export default {
  normalizeAnswerForQuestion,
  evaluateAttempt,
};
