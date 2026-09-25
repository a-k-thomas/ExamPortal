/**
 * Phase 5B — Attempt Timing & Deadline Enforcement Tests
 *
 * Tests authoritative server-side deadline calculation and auto-submission.
 * Uses deterministic timestamps (injected `now`) wherever possible to eliminate
 * dependence on wall-clock time and make failures reproducible.
 *
 * Run: node src/tests/attemptTiming.test.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import User from '../models/User.js';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import ExamAttempt from '../models/ExamAttempt.js';
import {
  getAvailableExams,
  startAttempt,
  getMyAttempt,
  saveAnswer,
  submitAttempt,
} from '../controllers/attemptController.js';
import { calculateAttemptDeadline, isAttemptExpired, DEFAULT_GRACE_MS } from '../services/attemptTimingService.js';

// ─── Test Utilities ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const results = [];

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅  ${name}`);
    results.push({ name, status: 'PASS' });
    passed++;
  } catch (err) {
    console.error(`  ❌  ${name}`);
    console.error(`      ${err.message}`);
    results.push({ name, status: 'FAIL', error: err.message });
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(
      `${label || 'assertEqual'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

// ─── Mock HTTP helpers ─────────────────────────────────────────────────────────

const mockRes = () => {
  const r = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data)  { this.body = data; return this; },
  };
  return r;
};

const mockReq = (overrides = {}) => ({
  params: {},
  body: {},
  query: {},
  user: null,
  ...overrides,
});

// ─── Seed Helpers ──────────────────────────────────────────────────────────────

const SEED_PREFIX = '__timing5b_';
let student, student2, teacher;
let exam30min; // 30-min duration exam, window open for 2h
let examShortWindow; // exam whose endTime is sooner than startedAt + duration
let q1, q2;

async function seedData() {
  const suffix = Date.now();

  teacher = await User.create({
    name: 'Timing Teacher',
    email: `${SEED_PREFIX}teacher_${suffix}@test.com`,
    password: 'Pass@1234',
    role: 'teacher',
  });

  student = await User.create({
    name: 'Timing Student',
    email: `${SEED_PREFIX}student_${suffix}@test.com`,
    password: 'Pass@1234',
    role: 'student',
  });

  student2 = await User.create({
    name: 'Timing Student2',
    email: `${SEED_PREFIX}student2_${suffix}@test.com`,
    password: 'Pass@1234',
    role: 'student',
  });

  const now = new Date();

  // exam30min: open 1h ago, closes in 1h, 30-min duration
  exam30min = await Exam.create({
    title: `Timing Exam 30m ${suffix}`,
    duration: 30,
    startTime: new Date(now.getTime() - 60 * 60 * 1000),
    endTime: new Date(now.getTime() + 60 * 60 * 1000),
    status: 'published',
    createdBy: teacher._id,
  });

  // examShortWindow: open now, closes in 5 min, 30-min duration
  // So effective deadline = min(startedAt + 30m, endTime) = endTime (5 min from now)
  examShortWindow = await Exam.create({
    title: `Timing Exam Short Window ${suffix}`,
    duration: 30,
    startTime: new Date(now.getTime() - 60 * 1000),
    endTime: new Date(now.getTime() + 5 * 60 * 1000),
    status: 'published',
    createdBy: teacher._id,
  });

  q1 = await Question.create({
    exam: exam30min._id,
    questionText: 'What is 1 + 1?',
    options: ['1', '2', '3', '4'],
    correctAnswer: '2',
    marks: 4,
    order: 1,
  });

  q2 = await Question.create({
    exam: exam30min._id,
    questionText: 'What is 2 × 2?',
    options: ['2', '4', '6', '8'],
    correctAnswer: '4',
    marks: 6,
    order: 2,
  });

  // Add a question to examShortWindow too
  await Question.create({
    exam: examShortWindow._id,
    questionText: 'Quick question?',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'B',
    marks: 5,
    order: 1,
  });
}

/**
 * Create a fresh in_progress attempt at a deterministic startedAt.
 * @param {Object} examDoc
 * @param {Object} studentDoc
 * @param {Date}   startedAt  - deterministic start time
 * @param {Array}  answers
 */
async function createAttempt(examDoc, studentDoc, startedAt, answers = []) {
  const questions = await Question.find({ exam: examDoc._id });
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  const initialAnswers =
    answers.length > 0
      ? answers
      : questions.map((q) => ({ question: q._id, selectedAnswer: null, marksAwarded: 0 }));

  return ExamAttempt.create({
    exam: examDoc._id,
    student: studentDoc._id,
    status: 'in_progress',
    startedAt,
    totalMarks,
    score: 0,
    answers: initialAnswers,
  });
}

async function cleanupData() {
  const examIds = [exam30min._id, examShortWindow._id];
  await ExamAttempt.deleteMany({ exam: { $in: examIds } });
  await Question.deleteMany({ exam: { $in: examIds } });
  await Exam.deleteMany({ _id: { $in: examIds } });
  await User.deleteMany({ _id: { $in: [teacher._id, student._id, student2._id] } });
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

async function runTests() {
  // ── Timing Service Unit Tests ────────────────────────────────────────────────

  await test('1. Deadline = startedAt + duration when that is earlier than endTime', async () => {
    const now = new Date('2030-01-01T10:00:00Z');
    const fakeAttempt = { startedAt: now };
    const fakeExam = {
      duration: 30, // 30 min
      endTime: new Date('2030-01-01T11:00:00Z'), // 60 min from now
    };
    const deadline = calculateAttemptDeadline(fakeAttempt, fakeExam);
    const expectedMs = now.getTime() + 30 * 60 * 1000;
    assertEqual(deadline.getTime(), expectedMs, 'deadline should be startedAt + 30min');
  });

  await test('2. Deadline = exam.endTime when exam ends before duration elapses', async () => {
    const now = new Date('2030-01-01T10:00:00Z');
    const fakeAttempt = { startedAt: now };
    const endTime = new Date('2030-01-01T10:10:00Z'); // only 10 min from now
    const fakeExam = {
      duration: 30, // 30 min, but window closes in 10 min
      endTime,
    };
    const deadline = calculateAttemptDeadline(fakeAttempt, fakeExam);
    assertEqual(deadline.getTime(), endTime.getTime(), 'deadline should be exam.endTime');
  });

  await test('3. isAttemptExpired returns false before deadline (with grace)', async () => {
    const startedAt = new Date('2030-01-01T10:00:00Z');
    const fakeAttempt = { startedAt };
    const fakeExam = {
      duration: 30,
      endTime: new Date('2030-01-01T11:00:00Z'),
    };
    // now = 5 minutes into the exam — well within deadline
    const now = new Date(startedAt.getTime() + 5 * 60 * 1000);
    const expired = isAttemptExpired(fakeAttempt, fakeExam, now);
    assertEqual(expired, false, 'should not be expired 5 min in');
  });

  await test('4. isAttemptExpired returns true after deadline + grace', async () => {
    const startedAt = new Date('2030-01-01T10:00:00Z');
    const fakeAttempt = { startedAt };
    const fakeExam = {
      duration: 30,
      endTime: new Date('2030-01-01T11:00:00Z'),
    };
    // now = 30 min + 16s past startedAt (past deadline + DEFAULT_GRACE_MS)
    const now = new Date(startedAt.getTime() + 30 * 60 * 1000 + DEFAULT_GRACE_MS + 1000);
    const expired = isAttemptExpired(fakeAttempt, fakeExam, now);
    assertEqual(expired, true, 'should be expired after deadline + grace');
  });

  // ── Controller Integration Tests ────────────────────────────────────────────

  await test('5. In-progress attempt before deadline can save an answer', async () => {
    // startedAt = now, so we are at t=0 (well within 30-min deadline)
    const attempt = await createAttempt(exam30min, student, new Date());
    const res = mockRes();
    await saveAnswer(
      mockReq({
        user: student,
        params: { id: attempt._id.toString() },
        body: { questionId: q1._id.toString(), selectedAnswer: '2' },
      }),
      res
    );
    assertEqual(res.statusCode, 200, 'save before deadline should be 200');
    assertEqual(res.body.answer.selectedAnswer, '2', 'answer persisted');
    assert(res.body.deadline, 'response includes deadline metadata');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  await test('6. In-progress attempt at/after deadline cannot save an answer (auto-submits)', async () => {
    // startedAt = 45 min ago (> 30-min duration + grace)
    const startedAt = new Date(Date.now() - 45 * 60 * 1000);
    const attempt = await createAttempt(exam30min, student, startedAt, [
      { question: q1._id, selectedAnswer: '2', marksAwarded: 0 },
      { question: q2._id, selectedAnswer: '4', marksAwarded: 0 },
    ]);
    const res = mockRes();
    await saveAnswer(
      mockReq({
        user: student,
        params: { id: attempt._id.toString() },
        body: { questionId: q1._id.toString(), selectedAnswer: '1' }, // late, wrong answer
      }),
      res
    );
    assertEqual(res.statusCode, 410, 'expired save should return 410');
    assertEqual(res.body.code, 'ATTEMPT_EXPIRED', 'ATTEMPT_EXPIRED code');
    assert(res.body.attempt.status === 'auto_submitted', 'attempt auto_submitted');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  await test('7. Late save does NOT persist the late answer', async () => {
    const startedAt = new Date(Date.now() - 45 * 60 * 1000);
    const attempt = await createAttempt(exam30min, student, startedAt, [
      { question: q1._id, selectedAnswer: null, marksAwarded: 0 },
      { question: q2._id, selectedAnswer: null, marksAwarded: 0 },
    ]);
    await saveAnswer(
      mockReq({
        user: student,
        params: { id: attempt._id.toString() },
        body: { questionId: q1._id.toString(), selectedAnswer: '2' },
      }),
      mockRes()
    );
    const dbAttempt = await ExamAttempt.findById(attempt._id);
    // The attempt is now auto_submitted; the late answer ('2') must NOT appear
    const a1 = dbAttempt.answers.find((a) => a.question.toString() === q1._id.toString());
    // Answer was null before the late save — it must still be null (or 0 marksAwarded from eval)
    assert(
      a1.selectedAnswer === null || a1.selectedAnswer === undefined,
      `Late answer must not be persisted; got: ${a1.selectedAnswer}`
    );
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  await test('8. getMyAttempt auto-submits an expired in_progress attempt', async () => {
    const startedAt = new Date(Date.now() - 45 * 60 * 1000);
    const attempt = await createAttempt(exam30min, student, startedAt, [
      { question: q1._id, selectedAnswer: '2', marksAwarded: 0 },
      { question: q2._id, selectedAnswer: '4', marksAwarded: 0 },
    ]);
    const res = mockRes();
    await getMyAttempt(
      mockReq({ user: student, params: { id: attempt._id.toString() } }),
      res
    );
    assertEqual(res.statusCode, 200, 'getMyAttempt should succeed');
    assertEqual(res.body.attempt.status, 'auto_submitted', 'expired attempt auto_submitted on GET');
    assert(res.body.attempt.submittedAt, 'submittedAt set');
    assert(res.body.attempt.score >= 0, 'score evaluated');
    assert(!JSON.stringify(res.body).includes('correctAnswer'), 'no correctAnswer leaked');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  await test('9. submitAttempt before deadline => status "submitted"', async () => {
    const attempt = await createAttempt(exam30min, student, new Date(), [
      { question: q1._id, selectedAnswer: '2', marksAwarded: 0 },
      { question: q2._id, selectedAnswer: '4', marksAwarded: 0 },
    ]);
    const res = mockRes();
    await submitAttempt(
      mockReq({ user: student, params: { id: attempt._id.toString() }, body: {} }),
      res
    );
    assertEqual(res.statusCode, 200, 'submit before deadline 200');
    assertEqual(res.body.attempt.status, 'submitted', 'status = submitted within deadline');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  await test('10. submitAttempt after deadline => status "auto_submitted"', async () => {
    const startedAt = new Date(Date.now() - 45 * 60 * 1000);
    const attempt = await createAttempt(exam30min, student, startedAt, [
      { question: q1._id, selectedAnswer: '2', marksAwarded: 0 },
      { question: q2._id, selectedAnswer: '4', marksAwarded: 0 },
    ]);
    const res = mockRes();
    await submitAttempt(
      mockReq({ user: student, params: { id: attempt._id.toString() }, body: {} }),
      res
    );
    assertEqual(res.statusCode, 200, 'submit after deadline 200');
    assertEqual(res.body.attempt.status, 'auto_submitted', 'status = auto_submitted past deadline');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  await test('11. Client cannot force "submitted" status after the deadline', async () => {
    const startedAt = new Date(Date.now() - 45 * 60 * 1000);
    const attempt = await createAttempt(exam30min, student, startedAt, [
      { question: q1._id, selectedAnswer: '2', marksAwarded: 0 },
      { question: q2._id, selectedAnswer: '4', marksAwarded: 0 },
    ]);
    const res = mockRes();
    // Client sends empty finalAnswers; regardless, server should set auto_submitted
    await submitAttempt(
      mockReq({
        user: student,
        params: { id: attempt._id.toString() },
        body: { answers: [] },
      }),
      res
    );
    const dbAttempt = await ExamAttempt.findById(attempt._id);
    assertEqual(dbAttempt.status, 'auto_submitted', 'DB status must be auto_submitted, not submitted');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  await test('12. submitAttempt after deadline ignores late final-answers batch', async () => {
    const startedAt = new Date(Date.now() - 45 * 60 * 1000);
    // Pre-saved q1 = null, q2 = null
    const attempt = await createAttempt(exam30min, student, startedAt);
    const res = mockRes();
    // Send a late batch claiming correct answers
    await submitAttempt(
      mockReq({
        user: student,
        params: { id: attempt._id.toString() },
        body: {
          answers: [
            { questionId: q1._id.toString(), selectedAnswer: '2' }, // correct
            { questionId: q2._id.toString(), selectedAnswer: '4' }, // correct
          ],
        },
      }),
      res
    );
    // Answers in the batch were after deadline, so they must be ignored
    // Pre-saved answers were null → score should be 0
    const dbAttempt = await ExamAttempt.findById(attempt._id);
    assertEqual(dbAttempt.status, 'auto_submitted', 'auto_submitted');
    assertEqual(dbAttempt.score, 0, 'late batch ignored → score 0');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  await test('13. Resuming an attempt does NOT reset startedAt', async () => {
    // Create attempt manually with a specific startedAt
    const fixedStartedAt = new Date(Date.now() - 5 * 60 * 1000); // 5 min ago
    const attempt = await createAttempt(exam30min, student, fixedStartedAt);
    const res = mockRes();
    // Call startAttempt — should resume, not create a new one
    await startAttempt(
      mockReq({ user: student, params: { examId: exam30min._id.toString() } }),
      res
    );
    assertEqual(res.body.resumed, true, 'should be resumed');
    const resumedStartedAt = new Date(res.body.attempt.startedAt).getTime();
    const diff = Math.abs(resumedStartedAt - fixedStartedAt.getTime());
    assert(diff < 1000, `startedAt should not change on resume; diff was ${diff}ms`);
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  await test('14. Resuming an attempt does NOT extend the deadline', async () => {
    const fixedStartedAt = new Date(Date.now() - 5 * 60 * 1000);
    const attempt = await createAttempt(exam30min, student, fixedStartedAt);
    // Expected deadline based on original startedAt
    const expectedDeadline = calculateAttemptDeadline(attempt, exam30min).getTime();

    const res = mockRes();
    await startAttempt(
      mockReq({ user: student, params: { examId: exam30min._id.toString() } }),
      res
    );
    const returnedDeadline = new Date(res.body.attempt.deadline).getTime();
    assertEqual(returnedDeadline, expectedDeadline, 'deadline must not extend on resume');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  await test('15. Auto-submitted attempt is immutable (second auto-submit is idempotent)', async () => {
    const startedAt = new Date(Date.now() - 45 * 60 * 1000);
    const attempt = await createAttempt(exam30min, student, startedAt, [
      { question: q1._id, selectedAnswer: '2', marksAwarded: 0 },
      { question: q2._id, selectedAnswer: '4', marksAwarded: 0 },
    ]);
    // First submit (auto)
    const res1 = mockRes();
    await submitAttempt(
      mockReq({ user: student, params: { id: attempt._id.toString() }, body: {} }),
      res1
    );
    const score1 = res1.body.attempt.score;

    // Second submit (idempotent)
    const res2 = mockRes();
    await submitAttempt(
      mockReq({ user: student, params: { id: attempt._id.toString() }, body: {} }),
      res2
    );
    assertEqual(res2.body.alreadySubmitted, true, 'second call is idempotent');
    assertEqual(res2.body.attempt.score, score1, 'score unchanged after idempotent call');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  await test('16. Submitted attempt is also immutable (idempotent)', async () => {
    const attempt = await createAttempt(exam30min, student, new Date(), [
      { question: q1._id, selectedAnswer: '2', marksAwarded: 0 },
      { question: q2._id, selectedAnswer: null, marksAwarded: 0 },
    ]);
    const res1 = mockRes();
    await submitAttempt(
      mockReq({ user: student, params: { id: attempt._id.toString() }, body: {} }),
      res1
    );
    const score1 = res1.body.attempt.score;

    const res2 = mockRes();
    await submitAttempt(
      mockReq({ user: student, params: { id: attempt._id.toString() }, body: {} }),
      res2
    );
    assertEqual(res2.body.alreadySubmitted, true, 'submitted attempt idempotent');
    assertEqual(res2.body.attempt.score, score1, 'score unchanged after idempotent call');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  await test('17. Auto-submission evaluates the correct score', async () => {
    // Both answers correct: q1 = 4 marks, q2 = 6 marks → total 10
    const startedAt = new Date(Date.now() - 45 * 60 * 1000);
    const attempt = await createAttempt(exam30min, student, startedAt, [
      { question: q1._id, selectedAnswer: '2', marksAwarded: 0 }, // correct
      { question: q2._id, selectedAnswer: '4', marksAwarded: 0 }, // correct
    ]);
    const res = mockRes();
    await submitAttempt(
      mockReq({ user: student, params: { id: attempt._id.toString() }, body: {} }),
      res
    );
    assertEqual(res.body.attempt.status, 'auto_submitted', 'auto_submitted');
    assertEqual(res.body.attempt.score, 10, 'score = 10 (both correct)');
    assertEqual(res.body.attempt.totalMarks, 10, 'totalMarks = 10');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  await test('18. correctAnswer is absent from all attempt responses', async () => {
    const attempt = await createAttempt(exam30min, student, new Date());
    const submitRes = mockRes();
    await submitAttempt(
      mockReq({ user: student, params: { id: attempt._id.toString() }, body: {} }),
      submitRes
    );
    assert(
      !JSON.stringify(submitRes.body).includes('correctAnswer'),
      'submitAttempt response must not contain correctAnswer'
    );

    const attempt2 = await createAttempt(exam30min, student, new Date());
    const getRes = mockRes();
    await getMyAttempt(
      mockReq({ user: student, params: { id: attempt2._id.toString() } }),
      getRes
    );
    assert(
      !JSON.stringify(getRes.body).includes('correctAnswer'),
      'getMyAttempt response must not contain correctAnswer'
    );
    await ExamAttempt.deleteMany({ _id: { $in: [attempt._id, attempt2._id] } });
  });

  await test('19. Cross-student protection: student cannot access another student\'s attempt', async () => {
    const attempt = await createAttempt(exam30min, student, new Date());
    const res = mockRes();
    await getMyAttempt(
      mockReq({ user: student2, params: { id: attempt._id.toString() } }),
      res
    );
    assertEqual(res.statusCode, 403, 'cross-student access must return 403');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📋  Phase 5B — Attempt Timing & Deadline Enforcement Tests\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('  ✔  MongoDB connected\n');

  await seedData();
  console.log('  ✔  Seed data created\n');

  await runTests();

  await cleanupData();
  console.log('\n  ✔  Seed data cleaned up\n');

  await mongoose.disconnect();

  console.log('─'.repeat(60));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('─'.repeat(60));

  if (failed > 0) {
    console.log('\nFailed tests:');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => console.log(`  ❌  ${r.name}\n      ${r.error}`));
    process.exit(1);
  } else {
    console.log('\n  All Phase 5B timing tests passed ✅\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
