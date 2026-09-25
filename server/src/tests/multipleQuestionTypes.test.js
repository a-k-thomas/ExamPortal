import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import ExamAttempt from '../models/ExamAttempt.js';
import { evaluateAttempt } from '../services/evaluationService.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online-exam-portal';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_12345';
const BASE_URL = 'http://localhost:5000/api';

const generateToken = (userId, role) => jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });

async function runTests() {
  await mongoose.connect(MONGODB_URI);
  console.log('[Test] Connected to MongoDB for Multiple Question Types Verification');

  const tests = [];

  try {
    const student = await User.findOne({ role: 'student' });
    const teacher = await User.findOne({ role: 'teacher' });
    const admin = await User.findOne({ role: 'admin' });

    if (!student || !teacher || !admin) {
      throw new Error('Required seed users (student, teacher, admin) not found in database');
    }

    const studentToken = generateToken(student._id, student.role);
    const teacherToken = generateToken(teacher._id, teacher.role);
    const adminToken = generateToken(admin._id, admin.role);

    // ─── 1. Teacher Creates Test Exam ──────────────────────────────────────────────
    const examStart = new Date(Date.now() - 5 * 60 * 1000);
    const examEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const testExam = await Exam.create({
      title: 'Comprehensive Question Types Test Exam',
      description: 'Verifies Single Choice, Multiple Select, True/False, and Short Answer.',
      instructions: 'Answer all questions to the best of your ability.',
      duration: 60,
      startTime: examStart,
      endTime: examEnd,
      status: 'draft',
      createdBy: teacher._id,
    });

    // ─── 2. Teacher Question Creation via API ───────────────────────────────────────
    // 2.1 SINGLE_CHOICE Creation
    const q1Res = await fetch(`${BASE_URL}/questions/exam/${testExam._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        questionType: 'SINGLE_CHOICE',
        questionText: 'What is the capital of France?',
        options: ['Berlin', 'Paris', 'Madrid', 'Rome'],
        correctAnswer: 'Paris',
        marks: 2,
        order: 1,
      }),
    });
    const q1Data = await q1Res.json();
    if (q1Res.status === 201 && q1Data.question.questionType === 'SINGLE_CHOICE') {
      tests.push('✅ 1. Teacher can create SINGLE_CHOICE question via API');
    } else {
      tests.push(`❌ 1. Failed to create SINGLE_CHOICE question: ${JSON.stringify(q1Data)}`);
    }

    // 2.2 MULTIPLE_SELECT Creation
    const q2Res = await fetch(`${BASE_URL}/questions/exam/${testExam._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        questionType: 'MULTIPLE_SELECT',
        questionText: 'Which of the following are programming languages?',
        options: ['Java', 'Python', 'HTML', 'C++'],
        correctAnswers: ['Java', 'Python', 'C++'],
        marks: 3,
        order: 2,
      }),
    });
    const q2Data = await q2Res.json();
    if (
      q2Res.status === 201 &&
      q2Data.question.questionType === 'MULTIPLE_SELECT' &&
      q2Data.question.correctAnswers.length === 3
    ) {
      tests.push('✅ 2. Teacher can create MULTIPLE_SELECT question with multiple correct answers');
    } else {
      tests.push(`❌ 2. Failed to create MULTIPLE_SELECT question: ${JSON.stringify(q2Data)}`);
    }

    // 2.3 TRUE_FALSE Creation
    const q3Res = await fetch(`${BASE_URL}/questions/exam/${testExam._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        questionType: 'TRUE_FALSE',
        questionText: 'The Earth revolves around the Sun.',
        correctAnswer: 'True',
        marks: 1.5,
        order: 3,
      }),
    });
    const q3Data = await q3Res.json();
    if (
      q3Res.status === 201 &&
      q3Data.question.questionType === 'TRUE_FALSE' &&
      q3Data.question.options.length === 2 &&
      q3Data.question.options.includes('True') &&
      q3Data.question.options.includes('False')
    ) {
      tests.push('✅ 3. Teacher can create TRUE_FALSE question (options automatically configured as True/False)');
    } else {
      tests.push(`❌ 3. Failed to create TRUE_FALSE question: ${JSON.stringify(q3Data)}`);
    }

    // 2.4 SHORT_ANSWER Creation
    const q4Res = await fetch(`${BASE_URL}/questions/exam/${testExam._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        questionType: 'SHORT_ANSWER',
        questionText: 'What does CPU stand for?',
        acceptedAnswers: ['Central Processing Unit', 'CPU'],
        marks: 2.5,
        order: 4,
      }),
    });
    const q4Data = await q4Res.json();
    if (
      q4Res.status === 201 &&
      q4Data.question.questionType === 'SHORT_ANSWER' &&
      q4Data.question.acceptedAnswers.length === 2
    ) {
      tests.push('✅ 4. Teacher can create SHORT_ANSWER question with multiple accepted answers');
    } else {
      tests.push(`❌ 4. Failed to create SHORT_ANSWER question: ${JSON.stringify(q4Data)}`);
    }

    // ─── 3. Security & Validation Checks ──────────────────────────────────────────
    // 3.1 Malformed question type rejected
    const badTypeRes = await fetch(`${BASE_URL}/questions/exam/${testExam._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        questionType: 'ESSAY_LONG_ANSWER',
        questionText: 'Write 500 words on AI.',
        marks: 5,
      }),
    });
    if (badTypeRes.status === 400) {
      tests.push('✅ 5. Security: Malformed question type is rejected (400 Bad Request)');
    } else {
      tests.push(`❌ 5. Malformed question type was not rejected (status: ${badTypeRes.status})`);
    }

    // 3.2 Publish Exam
    const pubRes = await fetch(`${BASE_URL}/exams/${testExam._id}/publish`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${teacherToken}`,
      },
    });
    if (pubRes.status === 200) {
      tests.push('✅ 6. Exam with all 4 question types successfully published');
    } else {
      tests.push('❌ 6. Failed to publish exam');
    }

    // 3.3 Correct Answer Protection (Student Exam View)
    const startAttemptRes = await fetch(`${BASE_URL}/attempts/exams/${testExam._id}/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
    });
    const startAttemptData = await startAttemptRes.json();
    const studentQuestions = startAttemptData.questions || [];

    const hasLeakedAnswers = studentQuestions.some(
      (q) => q.correctAnswer || q.correctAnswers || q.acceptedAnswers
    );
    if (startAttemptRes.status === 201 && !hasLeakedAnswers && studentQuestions.length === 4) {
      tests.push('✅ 7. Security: Student questions NEVER expose correctAnswer, correctAnswers, or acceptedAnswers');
    } else {
      tests.push('❌ 7. Security violation: Correct answers leaked to student!');
    }

    const attemptId = startAttemptData.attempt._id;

    // 3.4 Client cannot inject marksAwarded or isCorrect
    const injectRes = await fetch(`${BASE_URL}/attempts/${attemptId}/answer`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        questionId: q1Data.question._id,
        selectedAnswer: 'Berlin', // incorrect answer
        marksAwarded: 999,        // attempt injection
        isCorrect: true,          // attempt injection
      }),
    });
    const injectedAttempt = await ExamAttempt.findById(attemptId);
    const ans1 = injectedAttempt.answers.find((a) => a.question.toString() === q1Data.question._id.toString());
    if (injectRes.status === 200 && ans1.marksAwarded === 0) {
      tests.push('✅ 8. Security: Client-injected marksAwarded/isCorrect are strictly ignored (recorded 0 marks)');
    } else {
      tests.push('❌ 8. Security failure: Injected marks were accepted!');
    }

    // ─── 4. Unit / Integration Evaluation Tests ────────────────────────────────────
    // Create an auxiliary exam dedicated to granular evaluation unit tests
    const evalExam = await Exam.create({
      title: 'Eval Test Exam',
      duration: 30,
      startTime: examStart,
      endTime: examEnd,
      status: 'published',
      createdBy: teacher._id,
    });

    const [qSingle, qMulti, qTf, qShort, qLegacy] = await Promise.all([
      Question.create({
        exam: evalExam._id,
        questionType: 'SINGLE_CHOICE',
        questionText: 'Capital of France?',
        options: ['Berlin', 'Paris', 'Madrid', 'Rome'],
        correctAnswer: 'Paris',
        marks: 2,
        order: 1,
      }),
      Question.create({
        exam: evalExam._id,
        questionType: 'MULTIPLE_SELECT',
        questionText: 'Programming languages?',
        options: ['Java', 'Python', 'HTML', 'C++'],
        correctAnswers: ['Java', 'Python', 'C++'],
        marks: 3,
        order: 2,
      }),
      Question.create({
        exam: evalExam._id,
        questionType: 'TRUE_FALSE',
        questionText: 'Earth revolves around Sun?',
        options: ['True', 'False'],
        correctAnswer: 'True',
        marks: 1,
        order: 3,
      }),
      Question.create({
        exam: evalExam._id,
        questionType: 'SHORT_ANSWER',
        questionText: 'What does CPU stand for?',
        options: [],
        acceptedAnswers: ['Central Processing Unit', 'CPU'],
        marks: 4,
        order: 4,
      }),
      // Legacy question without explicit questionType
      Question.create({
        exam: evalExam._id,
        questionText: 'Legacy Single Choice MCQ?',
        options: ['Opt A', 'Opt B'],
        correctAnswer: 'Opt A',
        marks: 1,
        order: 5,
      }),
    ]);

    // ── 4A. SINGLE_CHOICE Evaluation Tests ──
    // Test 1: correct answer
    const attSingleCorrect = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qSingle._id, selectedAnswer: 'Paris' }],
    });
    const resSingleCorrect = await evaluateAttempt(attSingleCorrect._id);
    const scoreSingleCorrect = resSingleCorrect.attempt.answers.find(
      (a) => a.question.toString() === qSingle._id.toString()
    ).marksAwarded;
    if (scoreSingleCorrect === 2) {
      tests.push('✅ 9. SINGLE_CHOICE: Correct answer awards full marks (2/2)');
    } else {
      tests.push(`❌ 9. SINGLE_CHOICE correct answer failed (awarded ${scoreSingleCorrect})`);
    }

    // Test 2: incorrect answer
    const attSingleInc = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qSingle._id, selectedAnswer: 'Berlin' }],
    });
    const resSingleInc = await evaluateAttempt(attSingleInc._id);
    const scoreSingleInc = resSingleInc.attempt.answers.find(
      (a) => a.question.toString() === qSingle._id.toString()
    ).marksAwarded;
    if (scoreSingleInc === 0) {
      tests.push('✅ 10. SINGLE_CHOICE: Incorrect answer awards 0 marks');
    } else {
      tests.push(`❌ 10. SINGLE_CHOICE incorrect answer failed (awarded ${scoreSingleInc})`);
    }

    // Test 3: unanswered
    const attSingleUnans = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qSingle._id, selectedAnswer: null }],
    });
    const resSingleUnans = await evaluateAttempt(attSingleUnans._id);
    const scoreSingleUnans = resSingleUnans.attempt.answers.find(
      (a) => a.question.toString() === qSingle._id.toString()
    ).marksAwarded;
    if (scoreSingleUnans === 0) {
      tests.push('✅ 11. SINGLE_CHOICE: Unanswered question awards 0 marks');
    } else {
      tests.push(`❌ 11. SINGLE_CHOICE unanswered failed (awarded ${scoreSingleUnans})`);
    }

    // ── 4B. MULTIPLE_SELECT Evaluation Tests ──
    // Test 4: exact matching set
    const attMultiExact = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qMulti._id, selectedAnswer: ['Java', 'Python', 'C++'] }],
    });
    const resMultiExact = await evaluateAttempt(attMultiExact._id);
    const scoreMultiExact = resMultiExact.attempt.answers.find(
      (a) => a.question.toString() === qMulti._id.toString()
    ).marksAwarded;
    if (scoreMultiExact === 3) {
      tests.push('✅ 12. MULTIPLE_SELECT: Exact matching set awards full marks (3/3)');
    } else {
      tests.push(`❌ 12. MULTIPLE_SELECT exact match failed (awarded ${scoreMultiExact})`);
    }

    // Test 5: missing one correct option (partial not awarded)
    const attMultiMissing = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qMulti._id, selectedAnswer: ['Java', 'Python'] }],
    });
    const resMultiMissing = await evaluateAttempt(attMultiMissing._id);
    const scoreMultiMissing = resMultiMissing.attempt.answers.find(
      (a) => a.question.toString() === qMulti._id.toString()
    ).marksAwarded;
    if (scoreMultiMissing === 0) {
      tests.push('✅ 13. MULTIPLE_SELECT: Missing one option awards 0 marks (no partial credit)');
    } else {
      tests.push(`❌ 13. MULTIPLE_SELECT missing option failed (awarded ${scoreMultiMissing})`);
    }

    // Test 6: extra incorrect option
    const attMultiExtra = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qMulti._id, selectedAnswer: ['Java', 'Python', 'HTML', 'C++'] }],
    });
    const resMultiExtra = await evaluateAttempt(attMultiExtra._id);
    const scoreMultiExtra = resMultiExtra.attempt.answers.find(
      (a) => a.question.toString() === qMulti._id.toString()
    ).marksAwarded;
    if (scoreMultiExtra === 0) {
      tests.push('✅ 14. MULTIPLE_SELECT: Extra incorrect option awards 0 marks');
    } else {
      tests.push(`❌ 14. MULTIPLE_SELECT extra option failed (awarded ${scoreMultiExtra})`);
    }

    // Test 7: different option ordering (normalized order-insensitivity)
    const attMultiOrder = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qMulti._id, selectedAnswer: ['C++', 'Java', 'Python'] }],
    });
    const resMultiOrder = await evaluateAttempt(attMultiOrder._id);
    const scoreMultiOrder = resMultiOrder.attempt.answers.find(
      (a) => a.question.toString() === qMulti._id.toString()
    ).marksAwarded;
    if (scoreMultiOrder === 3) {
      tests.push('✅ 15. MULTIPLE_SELECT: Different option ordering is correctly normalized and awards full marks');
    } else {
      tests.push(`❌ 15. MULTIPLE_SELECT ordering failed (awarded ${scoreMultiOrder})`);
    }

    // Test 8: unanswered multiple select
    const attMultiUnans = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qMulti._id, selectedAnswer: [] }],
    });
    const resMultiUnans = await evaluateAttempt(attMultiUnans._id);
    const scoreMultiUnans = resMultiUnans.attempt.answers.find(
      (a) => a.question.toString() === qMulti._id.toString()
    ).marksAwarded;
    if (scoreMultiUnans === 0) {
      tests.push('✅ 16. MULTIPLE_SELECT: Unanswered (empty array) awards 0 marks');
    } else {
      tests.push(`❌ 16. MULTIPLE_SELECT unanswered failed (awarded ${scoreMultiUnans})`);
    }

    // ── 4C. TRUE_FALSE Evaluation Tests ──
    // Test 9: correct true
    const attTfTrue = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qTf._id, selectedAnswer: 'True' }],
    });
    const resTfTrue = await evaluateAttempt(attTfTrue._id);
    const scoreTfTrue = resTfTrue.attempt.answers.find(
      (a) => a.question.toString() === qTf._id.toString()
    ).marksAwarded;
    if (scoreTfTrue === 1) {
      tests.push('✅ 17. TRUE_FALSE: Correct True awards full marks (1/1)');
    } else {
      tests.push(`❌ 17. TRUE_FALSE True failed (awarded ${scoreTfTrue})`);
    }

    // Test 10: correct false (with lowercase normalized representation)
    const qTfFalseQ = await Question.create({
      exam: evalExam._id,
      questionType: 'TRUE_FALSE',
      questionText: 'HTML is a programming language.',
      options: ['True', 'False'],
      correctAnswer: 'False',
      marks: 1,
      order: 6,
    });
    const attTfFalse = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 12,
      answers: [{ question: qTfFalseQ._id, selectedAnswer: 'false' }],
    });
    const resTfFalse = await evaluateAttempt(attTfFalse._id);
    const scoreTfFalse = resTfFalse.attempt.answers.find(
      (a) => a.question.toString() === qTfFalseQ._id.toString()
    ).marksAwarded;
    if (scoreTfFalse === 1) {
      tests.push('✅ 18. TRUE_FALSE: Correct False with case normalization awards full marks (1/1)');
    } else {
      tests.push(`❌ 18. TRUE_FALSE False failed (awarded ${scoreTfFalse})`);
    }

    // Test 11: incorrect True/False
    const attTfInc = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qTf._id, selectedAnswer: 'False' }],
    });
    const resTfInc = await evaluateAttempt(attTfInc._id);
    const scoreTfInc = resTfInc.attempt.answers.find(
      (a) => a.question.toString() === qTf._id.toString()
    ).marksAwarded;
    if (scoreTfInc === 0) {
      tests.push('✅ 19. TRUE_FALSE: Incorrect answer awards 0 marks');
    } else {
      tests.push(`❌ 19. TRUE_FALSE incorrect failed (awarded ${scoreTfInc})`);
    }

    // Test 12: unanswered True/False
    const attTfUnans = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qTf._id, selectedAnswer: null }],
    });
    const resTfUnans = await evaluateAttempt(attTfUnans._id);
    const scoreTfUnans = resTfUnans.attempt.answers.find(
      (a) => a.question.toString() === qTf._id.toString()
    ).marksAwarded;
    if (scoreTfUnans === 0) {
      tests.push('✅ 20. TRUE_FALSE: Unanswered awards 0 marks');
    } else {
      tests.push(`❌ 20. TRUE_FALSE unanswered failed (awarded ${scoreTfUnans})`);
    }

    // ── 4D. SHORT_ANSWER Evaluation Tests ──
    // Test 13: exact match
    const attSaExact = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qShort._id, selectedAnswer: 'Central Processing Unit' }],
    });
    const resSaExact = await evaluateAttempt(attSaExact._id);
    const scoreSaExact = resSaExact.attempt.answers.find(
      (a) => a.question.toString() === qShort._id.toString()
    ).marksAwarded;
    if (scoreSaExact === 4) {
      tests.push('✅ 21. SHORT_ANSWER: Exact text match awards full marks (4/4)');
    } else {
      tests.push(`❌ 21. SHORT_ANSWER exact match failed (awarded ${scoreSaExact})`);
    }

    // Test 14: case-insensitive match
    const attSaCase = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qShort._id, selectedAnswer: 'central processing unit' }],
    });
    const resSaCase = await evaluateAttempt(attSaCase._id);
    const scoreSaCase = resSaCase.attempt.answers.find(
      (a) => a.question.toString() === qShort._id.toString()
    ).marksAwarded;
    if (scoreSaCase === 4) {
      tests.push('✅ 22. SHORT_ANSWER: Case-insensitive match awards full marks (4/4)');
    } else {
      tests.push(`❌ 22. SHORT_ANSWER case-insensitive failed (awarded ${scoreSaCase})`);
    }

    // Test 15: leading/trailing whitespace
    const attSaTrim = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qShort._id, selectedAnswer: '   Central Processing Unit   ' }],
    });
    const resSaTrim = await evaluateAttempt(attSaTrim._id);
    const scoreSaTrim = resSaTrim.attempt.answers.find(
      (a) => a.question.toString() === qShort._id.toString()
    ).marksAwarded;
    if (scoreSaTrim === 4) {
      tests.push('✅ 23. SHORT_ANSWER: Leading/trailing whitespace trimmed and awards full marks');
    } else {
      tests.push(`❌ 23. SHORT_ANSWER whitespace trim failed (awarded ${scoreSaTrim})`);
    }

    // Test 16: repeated internal whitespace
    const attSaInternal = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qShort._id, selectedAnswer: 'Central    Processing    Unit' }],
    });
    const resSaInternal = await evaluateAttempt(attSaInternal._id);
    const scoreSaInternal = resSaInternal.attempt.answers.find(
      (a) => a.question.toString() === qShort._id.toString()
    ).marksAwarded;
    if (scoreSaInternal === 4) {
      tests.push('✅ 24. SHORT_ANSWER: Repeated whitespace collapsed into single space and awards full marks');
    } else {
      tests.push(`❌ 24. SHORT_ANSWER repeated whitespace failed (awarded ${scoreSaInternal})`);
    }

    // Test 17: alternative accepted answer (e.g. "CPU")
    const attSaAlt = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qShort._id, selectedAnswer: 'cpu' }],
    });
    const resSaAlt = await evaluateAttempt(attSaAlt._id);
    const scoreSaAlt = resSaAlt.attempt.answers.find(
      (a) => a.question.toString() === qShort._id.toString()
    ).marksAwarded;
    if (scoreSaAlt === 4) {
      tests.push('✅ 25. SHORT_ANSWER: Alternative accepted answer ("cpu") awards full marks (4/4)');
    } else {
      tests.push(`❌ 25. SHORT_ANSWER alternative answer failed (awarded ${scoreSaAlt})`);
    }

    // Test 18: incorrect short answer
    const attSaInc = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qShort._id, selectedAnswer: 'Central Processing' }],
    });
    const resSaInc = await evaluateAttempt(attSaInc._id);
    const scoreSaInc = resSaInc.attempt.answers.find(
      (a) => a.question.toString() === qShort._id.toString()
    ).marksAwarded;
    if (scoreSaInc === 0) {
      tests.push('✅ 26. SHORT_ANSWER: Incomplete/incorrect text awards 0 marks');
    } else {
      tests.push(`❌ 26. SHORT_ANSWER incorrect failed (awarded ${scoreSaInc})`);
    }

    // Test 19: unanswered short answer
    const attSaUnans = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qShort._id, selectedAnswer: '   ' }],
    });
    const resSaUnans = await evaluateAttempt(attSaUnans._id);
    const scoreSaUnans = resSaUnans.attempt.answers.find(
      (a) => a.question.toString() === qShort._id.toString()
    ).marksAwarded;
    if (scoreSaUnans === 0) {
      tests.push('✅ 27. SHORT_ANSWER: Empty/whitespace-only input awards 0 marks');
    } else {
      tests.push(`❌ 27. SHORT_ANSWER empty input failed (awarded ${scoreSaUnans})`);
    }

    // ── 4E. BACKWARD COMPATIBILITY Test ──
    // Test 20: Legacy question without questionType in DB
    const attLegacy = await ExamAttempt.create({
      exam: evalExam._id,
      student: student._id,
      totalMarks: 11,
      answers: [{ question: qLegacy._id, selectedAnswer: 'Opt A' }],
    });
    const resLegacy = await evaluateAttempt(attLegacy._id);
    const scoreLegacy = resLegacy.attempt.answers.find(
      (a) => a.question.toString() === qLegacy._id.toString()
    ).marksAwarded;
    if (scoreLegacy === 1) {
      tests.push('✅ 28. Backward Compatibility: Legacy question without questionType evaluates properly as SINGLE_CHOICE (1/1)');
    } else {
      tests.push(`❌ 28. Backward compatibility failed (awarded ${scoreLegacy})`);
    }

    // ─── 5. Teacher Reporting Question-Level Breakdown Test ─────────────────────────
    const reportRes = await fetch(`${BASE_URL}/reports/exams/${testExam._id}/questions`, {
      headers: {
        Authorization: `Bearer ${teacherToken}`,
      },
    });
    const reportData = await reportRes.json();
    const repQuestions = reportData.report?.questions || [];
    const allTypesReported =
      repQuestions.some((q) => q.questionType === 'SINGLE_CHOICE') &&
      repQuestions.some((q) => q.questionType === 'MULTIPLE_SELECT') &&
      repQuestions.some((q) => q.questionType === 'TRUE_FALSE') &&
      repQuestions.some((q) => q.questionType === 'SHORT_ANSWER');

    if (reportRes.status === 200 && allTypesReported) {
      tests.push('✅ 29. Reporting: Question performance report identifies questionType for all 4 types');
    } else {
      tests.push(`❌ 29. Reporting question types verification failed: ${JSON.stringify(reportData)}`);
    }

    // Cleanup auxiliary test entities
    await Question.deleteMany({ exam: evalExam._id });
    await ExamAttempt.deleteMany({ exam: evalExam._id });
    await Exam.findByIdAndDelete(evalExam._id);

    console.log('\n======================================================');
    console.log(' MULTIPLE QUESTION TYPES AUTOMATED TEST RESULTS');
    console.log('======================================================');
    tests.forEach((t) => console.log(t));

    const failed = tests.filter((t) => t.startsWith('❌'));
    if (failed.length > 0) {
      console.error(`\n${failed.length} test(s) failed!`);
      process.exit(1);
    } else {
      console.log(`\nAll ${tests.length} multiple question type tests passed successfully! 🚀`);
    }
  } catch (error) {
    console.error(`❌ Exception during test execution: ${error.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[Test] Disconnected from MongoDB');
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
