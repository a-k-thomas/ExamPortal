/**
 * Phase 5A — Evaluation Service Tests
 *
 * Verifies authoritative server-side scoring via evaluationService.evaluateAttempt().
 * Tests run against a live MongoDB connection (same pattern as attemptController.test.js).
 *
 * Run: node src/tests/evaluationService.test.js
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
import { evaluateAttempt } from '../services/evaluationService.js';

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
    throw new Error(`${label || 'assertEqual'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// ─── Seed Helpers ──────────────────────────────────────────────────────────────

const SEED_PREFIX = '__eval5a_';
let student, teacher, exam, questions;

async function seedData() {
  const suffix = Date.now();

  teacher = await User.create({
    name: 'Eval Teacher',
    email: `${SEED_PREFIX}teacher_${suffix}@test.com`,
    password: 'Pass@1234',
    role: 'teacher',
  });

  student = await User.create({
    name: 'Eval Student',
    email: `${SEED_PREFIX}student_${suffix}@test.com`,
    password: 'Pass@1234',
    role: 'student',
  });

  const now = new Date();
  exam = await Exam.create({
    title: `Eval Exam ${suffix}`,
    description: 'Phase 5A test exam',
    duration: 60,
    startTime: new Date(now.getTime() - 5 * 60000),
    endTime: new Date(now.getTime() + 55 * 60000),
    status: 'published',
    createdBy: teacher._id,
  });

  // 3 questions: marks 5, 3, 2  — total 10
  const q1 = await Question.create({
    exam: exam._id,
    questionText: 'What is 2+2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: '4',
    marks: 5,
    order: 1,
  });

  const q2 = await Question.create({
    exam: exam._id,
    questionText: 'Capital of France?',
    options: ['London', 'Paris', 'Berlin', 'Rome'],
    correctAnswer: 'Paris',
    marks: 3,
    order: 2,
  });

  const q3 = await Question.create({
    exam: exam._id,
    questionText: 'Sky colour?',
    options: ['Red', 'Green', 'Blue', 'Yellow'],
    correctAnswer: 'Blue',
    marks: 2,
    order: 3,
  });

  questions = [q1, q2, q3];
}

/** Create a fresh in_progress attempt with given pre-saved answers */
async function createAttempt(preAnswers = []) {
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
  return ExamAttempt.create({
    exam: exam._id,
    student: student._id,
    status: 'in_progress',
    startedAt: new Date(),
    totalMarks,
    score: 0,
    answers: preAnswers,
  });
}

async function cleanupData() {
  await ExamAttempt.deleteMany({ exam: exam._id });
  await Question.deleteMany({ exam: exam._id });
  await Exam.deleteOne({ _id: exam._id });
  await User.deleteOne({ _id: student._id });
  await User.deleteOne({ _id: teacher._id });
}

// ─── Test Cases ────────────────────────────────────────────────────────────────

async function runTests() {
  // 1. Correct answer → full marks
  await test('Correct answer receives full marks for that question', async () => {
    const attempt = await createAttempt([
      { question: questions[0]._id, selectedAnswer: '4', marksAwarded: 0 },
      { question: questions[1]._id, selectedAnswer: null, marksAwarded: 0 },
      { question: questions[2]._id, selectedAnswer: null, marksAwarded: 0 },
    ]);
    const { attempt: result } = await evaluateAttempt(attempt._id);
    const a0 = result.answers.find((a) => a.question.toString() === questions[0]._id.toString());
    assertEqual(a0.marksAwarded, 5, 'q1 marksAwarded');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  // 2. Incorrect answer → 0 marks
  await test('Incorrect answer receives 0 marks', async () => {
    const attempt = await createAttempt([
      { question: questions[0]._id, selectedAnswer: '3', marksAwarded: 0 },
      { question: questions[1]._id, selectedAnswer: null, marksAwarded: 0 },
      { question: questions[2]._id, selectedAnswer: null, marksAwarded: 0 },
    ]);
    const { attempt: result } = await evaluateAttempt(attempt._id);
    const a0 = result.answers.find((a) => a.question.toString() === questions[0]._id.toString());
    assertEqual(a0.marksAwarded, 0, 'q1 marksAwarded (wrong)');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  // 3. Unanswered (null) → 0 marks
  await test('Unanswered question (null) receives 0 marks', async () => {
    const attempt = await createAttempt([
      { question: questions[0]._id, selectedAnswer: null, marksAwarded: 0 },
      { question: questions[1]._id, selectedAnswer: null, marksAwarded: 0 },
      { question: questions[2]._id, selectedAnswer: null, marksAwarded: 0 },
    ]);
    const { attempt: result } = await evaluateAttempt(attempt._id);
    result.answers.forEach((a) => assertEqual(a.marksAwarded, 0, 'null answer marksAwarded'));
    assertEqual(result.score, 0, 'total score for all-null');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  // 4. All correct → score equals sum of all marks
  await test('All correct answers produce score equal to totalMarks', async () => {
    const attempt = await createAttempt([
      { question: questions[0]._id, selectedAnswer: '4', marksAwarded: 0 },
      { question: questions[1]._id, selectedAnswer: 'Paris', marksAwarded: 0 },
      { question: questions[2]._id, selectedAnswer: 'Blue', marksAwarded: 0 },
    ]);
    const { attempt: result } = await evaluateAttempt(attempt._id);
    assertEqual(result.score, 10, 'score all correct');
    assertEqual(result.totalMarks, 10, 'totalMarks all correct');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  // 5. Mixed correct/incorrect — score is additive of only correct marks
  await test('Mixed answers: score equals sum of marks for correct questions only', async () => {
    const attempt = await createAttempt([
      { question: questions[0]._id, selectedAnswer: '4', marksAwarded: 0 },     // correct +5
      { question: questions[1]._id, selectedAnswer: 'London', marksAwarded: 0 }, // wrong  +0
      { question: questions[2]._id, selectedAnswer: 'Blue', marksAwarded: 0 },   // correct +2
    ]);
    const { attempt: result } = await evaluateAttempt(attempt._id);
    assertEqual(result.score, 7, 'score partial correct');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  // 6. totalMarks is computed from DB Question.marks — client-provided value ignored
  await test('totalMarks is computed server-side from Question documents (client value ignored)', async () => {
    // deliberately set a wrong totalMarks on the attempt before evaluation
    const attempt = await createAttempt([
      { question: questions[0]._id, selectedAnswer: '4', marksAwarded: 0 },
      { question: questions[1]._id, selectedAnswer: 'Paris', marksAwarded: 0 },
      { question: questions[2]._id, selectedAnswer: 'Blue', marksAwarded: 0 },
    ]);
    // tamper totalMarks
    await ExamAttempt.findByIdAndUpdate(attempt._id, { totalMarks: 999 });
    const { attempt: result } = await evaluateAttempt(attempt._id);
    // evaluateAttempt must override the tampered value
    assertEqual(result.totalMarks, 10, 'totalMarks overridden by server');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  // 7. Client-provided score/marksAwarded are ignored — server recalculates
  await test('Pre-existing marksAwarded on answers are overwritten by server calculation', async () => {
    const attempt = await createAttempt([
      { question: questions[0]._id, selectedAnswer: '3', marksAwarded: 999 }, // wrong answer, tampered marks
      { question: questions[1]._id, selectedAnswer: null, marksAwarded: 999 },
      { question: questions[2]._id, selectedAnswer: null, marksAwarded: 999 },
    ]);
    const { attempt: result } = await evaluateAttempt(attempt._id);
    const a0 = result.answers.find((a) => a.question.toString() === questions[0]._id.toString());
    assertEqual(a0.marksAwarded, 0, 'tampered marksAwarded corrected');
    assertEqual(result.score, 0, 'tampered score corrected');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  // 8. correctAnswer is NOT present on returned attempt object
  await test('evaluateAttempt return value does not expose correctAnswer', async () => {
    const attempt = await createAttempt([
      { question: questions[0]._id, selectedAnswer: '4', marksAwarded: 0 },
      { question: questions[1]._id, selectedAnswer: 'Paris', marksAwarded: 0 },
      { question: questions[2]._id, selectedAnswer: 'Blue', marksAwarded: 0 },
    ]);
    const { attempt: result } = await evaluateAttempt(attempt._id);
    // The returned attempt is an ExamAttempt document — it should not have a correctAnswer field
    assert(!('correctAnswer' in result), 'attempt object must not expose correctAnswer');
    // answers array also must not contain correctAnswer
    result.answers.forEach((a) => {
      assert(!('correctAnswer' in a), 'answer subdoc must not expose correctAnswer');
    });
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  // 9. Already submitted attempt — idempotent (alreadySubmitted flag, no recalculation)
  await test('Submitting an already-submitted attempt is idempotent (no recalculation)', async () => {
    const attempt = await createAttempt([
      { question: questions[0]._id, selectedAnswer: '4', marksAwarded: 0 },
      { question: questions[1]._id, selectedAnswer: 'Paris', marksAwarded: 0 },
      { question: questions[2]._id, selectedAnswer: 'Blue', marksAwarded: 0 },
    ]);
    // First evaluation
    await evaluateAttempt(attempt._id, { status: 'submitted' });
    // Second call — must return alreadySubmitted without recalculating
    const { alreadySubmitted, attempt: result } = await evaluateAttempt(attempt._id, { status: 'submitted' });
    assertEqual(alreadySubmitted, true, 'alreadySubmitted flag');
    assertEqual(result.status, 'submitted', 'status unchanged');
    // Score should be persisted, not reset
    assertEqual(result.score, 10, 'score preserved after idempotent call');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  // 10. auto_submitted attempt — also idempotent
  await test('auto_submitted attempt is also treated as idempotent', async () => {
    const attempt = await createAttempt([
      { question: questions[0]._id, selectedAnswer: '4', marksAwarded: 0 },
    ]);
    await evaluateAttempt(attempt._id, { status: 'auto_submitted' });
    const { alreadySubmitted } = await evaluateAttempt(attempt._id);
    assertEqual(alreadySubmitted, true, 'auto_submitted idempotent flag');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  // 11. finalAnswers batch merges correctly (override pre-saved answer before scoring)
  await test('finalAnswers batch is merged before evaluation (overrides prior saved answer)', async () => {
    // Pre-saved incorrect answer for q1
    const attempt = await createAttempt([
      { question: questions[0]._id, selectedAnswer: '3', marksAwarded: 0 }, // wrong
      { question: questions[1]._id, selectedAnswer: null, marksAwarded: 0 },
      { question: questions[2]._id, selectedAnswer: null, marksAwarded: 0 },
    ]);
    // Submit with correct answer in finalAnswers batch
    const { attempt: result } = await evaluateAttempt(attempt._id, {
      finalAnswers: [{ questionId: questions[0]._id.toString(), selectedAnswer: '4' }],
      status: 'submitted',
    });
    assertEqual(result.score, 5, 'finalAnswers override applied before scoring');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  // 12. Invalid answer in finalAnswers batch (not in question options) is rejected → null
  await test('Invalid finalAnswers value (not in options) is normalised to null (0 marks)', async () => {
    const attempt = await createAttempt([
      { question: questions[0]._id, selectedAnswer: null, marksAwarded: 0 },
      { question: questions[1]._id, selectedAnswer: null, marksAwarded: 0 },
      { question: questions[2]._id, selectedAnswer: null, marksAwarded: 0 },
    ]);
    const { attempt: result } = await evaluateAttempt(attempt._id, {
      finalAnswers: [{ questionId: questions[0]._id.toString(), selectedAnswer: 'HACKED' }],
    });
    const a0 = result.answers.find((a) => a.question.toString() === questions[0]._id.toString());
    assertEqual(a0.marksAwarded, 0, 'invalid option gives 0 marks');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  // 13. Questions absent from answers map receive 0 marks (robustness)
  await test('Questions missing from answers map receive 0 marks (no error thrown)', async () => {
    // Only provide answers for q1, skip q2 and q3
    const attempt = await createAttempt([
      { question: questions[0]._id, selectedAnswer: '4', marksAwarded: 0 },
      // q2 and q3 intentionally omitted
    ]);
    const { attempt: result } = await evaluateAttempt(attempt._id);
    // Service normalises missing answers — score should only reflect q1
    assertEqual(result.score, 5, 'score only for answered question');
    assertEqual(result.totalMarks, 10, 'totalMarks still full');
    await ExamAttempt.deleteOne({ _id: attempt._id });
  });

  // 14. Invalid attemptId format throws error with statusCode 400
  await test('Invalid attemptId format throws a 400 statusCode error', async () => {
    let caughtError = null;
    try {
      await evaluateAttempt('not-a-valid-id');
    } catch (err) {
      caughtError = err;
    }
    assert(caughtError !== null, 'Error should have been thrown');
    assertEqual(caughtError.statusCode, 400, 'statusCode should be 400');
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📋  Phase 5A — Evaluation Service Tests\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('  ✔  MongoDB connected\n');

  await seedData();
  console.log('  ✔  Seed data created\n');

  await runTests();

  await cleanupData();
  console.log('\n  ✔  Seed data cleaned up\n');

  await mongoose.disconnect();

  console.log('─'.repeat(55));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('─'.repeat(55));

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter((r) => r.status === 'FAIL').forEach((r) => {
      console.log(`  ❌  ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n  All Phase 5A evaluation service tests passed ✅\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
