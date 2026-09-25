import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import ExamAttempt from '../models/ExamAttempt.js';

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Test] Connected to MongoDB for Phase 6A Result Tests');

  const tests = [];

  // 1. Authenticate test users
  const studentRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@example.com', password: 'Student@123' }),
  });
  const studentData = await studentRes.json();
  const studentToken = studentData.token;

  let student2 = await User.findOne({ email: 'student2@example.com' });
  if (!student2) {
    student2 = await User.create({
      name: 'Student Two',
      email: 'student2@example.com',
      password: 'Student@123',
      role: 'student',
    });
  }

  // Login as student2
  let student2Token;
  const student2Res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student2@example.com', password: 'Student@123' }),
  });
  if (student2Res.ok) {
    const data = await student2Res.json();
    student2Token = data.token;
  } else {
    // If password mismatch from prior runs, update it
    student2.password = 'Student@123';
    await student2.save();
    const retryRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student2@example.com', password: 'Student@123' }),
    });
    const data = await retryRes.json();
    student2Token = data.token;
  }

  // Login as teacher
  const teacherRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teacher@example.com', password: 'Teacher@123' }),
  });
  const teacherData = await teacherRes.json();
  const teacherToken = teacherData.token;

  const studentHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${studentToken}`,
  };

  const student2Headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${student2Token}`,
  };

  const teacherHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${teacherToken}`,
  };

  const studentUser = await User.findOne({ email: 'student@example.com' });
  const teacherUser = await User.findOne({ email: 'teacher@example.com' });

  // Create test exam
  const now = new Date();
  const testExam = await Exam.create({
    title: 'Phase 6A Result Test Exam',
    duration: 45,
    startTime: new Date(now.getTime() - 3600000),
    endTime: new Date(now.getTime() + 7200000),
    status: 'published',
    createdBy: teacherUser._id,
  });

  const q1 = await Question.create({
    exam: testExam._id,
    questionText: 'Result Test Question 1',
    options: ['Alpha', 'Beta', 'Gamma'],
    correctAnswer: 'Alpha',
    marks: 10,
    order: 1,
  });

  const q2 = await Question.create({
    exam: testExam._id,
    questionText: 'Result Test Question 2',
    options: ['Red', 'Green', 'Blue'],
    correctAnswer: 'Green',
    marks: 10,
    order: 2,
  });

  // Seed Attempts:
  // 1. In-progress attempt for student
  const inProgressAttempt = await ExamAttempt.create({
    exam: testExam._id,
    student: studentUser._id,
    status: 'in_progress',
    startedAt: new Date(now.getTime() - 10000),
    totalMarks: 20,
    score: 0,
    answers: [
      { question: q1._id, selectedAnswer: 'Alpha', marksAwarded: 0 },
      { question: q2._id, selectedAnswer: null, marksAwarded: 0 },
    ],
  });

  // 2. Submitted attempt for student (scored 10 / 20 = 50%)
  const submittedAttempt = await ExamAttempt.create({
    exam: testExam._id,
    student: studentUser._id,
    status: 'submitted',
    startedAt: new Date(now.getTime() - 20000),
    submittedAt: new Date(now.getTime() - 1000),
    totalMarks: 20,
    score: 10,
    answers: [
      { question: q1._id, selectedAnswer: 'Alpha', marksAwarded: 10 },
      { question: q2._id, selectedAnswer: 'Red', marksAwarded: 0 },
    ],
  });

  // 3. Auto-submitted attempt for student (scored 20 / 20 = 100%)
  const autoSubmittedAttempt = await ExamAttempt.create({
    exam: testExam._id,
    student: studentUser._id,
    status: 'auto_submitted',
    startedAt: new Date(now.getTime() - 50000),
    submittedAt: new Date(now.getTime() - 2000),
    totalMarks: 20,
    score: 20,
    answers: [
      { question: q1._id, selectedAnswer: 'Alpha', marksAwarded: 10 },
      { question: q2._id, selectedAnswer: 'Green', marksAwarded: 10 },
    ],
  });

  // 4. Attempt with 0 totalMarks (edge case)
  const zeroMarksExam = await Exam.create({
    title: 'Zero Marks Exam',
    duration: 20,
    startTime: new Date(now.getTime() - 3600000),
    endTime: new Date(now.getTime() + 7200000),
    status: 'published',
    createdBy: teacherUser._id,
  });

  const zeroMarksAttempt = await ExamAttempt.create({
    exam: zeroMarksExam._id,
    student: studentUser._id,
    status: 'submitted',
    startedAt: new Date(now.getTime() - 15000),
    submittedAt: new Date(now.getTime() - 500),
    totalMarks: 0,
    score: 0,
    answers: [],
  });

  // ─── TEST 1: Unauthenticated request is rejected (401) ───
  const res1 = await fetch(`${BASE_URL}/attempts/${submittedAttempt._id}/result`);
  tests.push(
    res1.status === 401
      ? '✅ 1. Unauthenticated request to result endpoint is rejected (401 Unauthorized)'
      : '❌ 1. Expected 401 for unauthenticated request, got ' + res1.status
  );

  // ─── TEST 2: Teacher cannot access student result endpoint (403) ───
  const res2 = await fetch(`${BASE_URL}/attempts/${submittedAttempt._id}/result`, {
    headers: teacherHeaders,
  });
  tests.push(
    res2.status === 403
      ? '✅ 2. Teacher is rejected from student result endpoint (403 Forbidden)'
      : '❌ 2. Expected 403 for teacher accessing result endpoint, got ' + res2.status
  );

  // ─── TEST 3: Nonexistent attempt returns 404 ───
  const nonExistentId = new mongoose.Types.ObjectId();
  const res3 = await fetch(`${BASE_URL}/attempts/${nonExistentId}/result`, {
    headers: studentHeaders,
  });
  tests.push(
    res3.status === 404
      ? '✅ 3. Nonexistent attempt ID returns 404 Not Found'
      : '❌ 3. Expected 404 for nonexistent attempt, got ' + res3.status
  );

  // ─── TEST 4: Cross-student result access is rejected (403) ───
  const res4 = await fetch(`${BASE_URL}/attempts/${submittedAttempt._id}/result`, {
    headers: student2Headers,
  });
  tests.push(
    res4.status === 403
      ? '✅ 4. Cross-student access is rejected (403 Forbidden)'
      : '❌ 4. Expected 403 for cross-student access, got ' + res4.status
  );

  // ─── TEST 5: In-progress attempt returns 409 ───
  const res5 = await fetch(`${BASE_URL}/attempts/${inProgressAttempt._id}/result`, {
    headers: studentHeaders,
  });
  const data5 = await res5.json();
  tests.push(
    res5.status === 409 && data5.code === 'RESULT_NOT_AVAILABLE'
      ? '✅ 5. In-progress attempt returns 409 Conflict (RESULT_NOT_AVAILABLE)'
      : '❌ 5. Expected 409 for in-progress attempt, got ' + res5.status
  );

  // ─── TEST 6: Own submitted attempt result succeeds (200) ───
  const res6 = await fetch(`${BASE_URL}/attempts/${submittedAttempt._id}/result`, {
    headers: studentHeaders,
  });
  const data6 = await res6.json();
  const r6 = data6.result;
  const test6Passed =
    res6.status === 200 &&
    data6.success === true &&
    r6 &&
    r6.attemptId === submittedAttempt._id.toString() &&
    r6.examTitle === testExam.title &&
    r6.status === 'submitted' &&
    r6.score === 10 &&
    r6.totalMarks === 20 &&
    r6.percentage === 50 &&
    r6.duration === 45 &&
    r6.startedAt &&
    r6.submittedAt;
  tests.push(
    test6Passed
      ? '✅ 6. Own submitted attempt result succeeds with complete payload'
      : `❌ 6. Submitted attempt result failed: ${res6.status} ${JSON.stringify(data6)}`
  );

  // ─── TEST 7: Own auto_submitted attempt result succeeds (200) ───
  const res7 = await fetch(`${BASE_URL}/attempts/${autoSubmittedAttempt._id}/result`, {
    headers: studentHeaders,
  });
  const data7 = await res7.json();
  const r7 = data7.result;
  const test7Passed =
    res7.status === 200 &&
    data7.success === true &&
    r7 &&
    r7.attemptId === autoSubmittedAttempt._id.toString() &&
    r7.status === 'auto_submitted' &&
    r7.score === 20 &&
    r7.totalMarks === 20 &&
    r7.percentage === 100;
  tests.push(
    test7Passed
      ? '✅ 7. Own auto_submitted attempt result succeeds with complete payload'
      : `❌ 7. Auto_submitted attempt result failed: ${res7.status} ${JSON.stringify(data7)}`
  );

  // ─── TEST 8: Percentage calculated server-side correctly ───
  tests.push(
    r6.percentage === 50 && r7.percentage === 100
      ? '✅ 8. Percentage is calculated accurately server-side (50% and 100%)'
      : `❌ 8. Percentage calculation mismatch: r6=${r6?.percentage}, r7=${r7?.percentage}`
  );

  // ─── TEST 9: Zero totalMarks handled safely without division by zero ───
  const res9 = await fetch(`${BASE_URL}/attempts/${zeroMarksAttempt._id}/result`, {
    headers: studentHeaders,
  });
  const data9 = await res9.json();
  tests.push(
    res9.status === 200 && data9.result?.percentage === 0
      ? '✅ 9. Zero totalMarks handled safely with percentage = 0'
      : `❌ 9. Zero totalMarks handling failed: ${res9.status} ${JSON.stringify(data9)}`
  );

  // ─── TEST 10: Completed result returns question review items safely ───
  const hasQuestionsReview =
    Array.isArray(data6.result?.questions) &&
    data6.result.questions.length > 0 &&
    data6.result.questions[0].status !== undefined;
  tests.push(
    hasQuestionsReview
      ? '✅ 10. Completed result successfully includes question review items with status'
      : '❌ 10. Question review items missing or malformed in completed result payload'
  );

  // ─── TEST 11: Response does not expose another student data ───
  const payloadString = JSON.stringify(data6);
  const leaksOtherStudent =
    payloadString.includes('Student Two') ||
    payloadString.includes('student2@example.com') ||
    payloadString.includes(student2._id.toString());
  tests.push(
    !leaksOtherStudent
      ? '✅ 11. Result response does not expose another student data'
      : '❌ 11. Another student data leaked in result response'
  );

  // ─── TEST 12: Existing Phase 1–5 routes remain unaffected ───
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  const examsRes = await fetch(`${BASE_URL}/exams`, { headers: teacherHeaders });
  tests.push(
    healthRes.status === 200 &&
      healthData.database?.status === 'connected' &&
      examsRes.status === 200
      ? '✅ 12. Existing Phase 1–5 routes remain fully functional (/api/health, /api/exams)'
      : '❌ 12. Existing routes regressed'
  );

  // Cleanup seeded test data
  await ExamAttempt.deleteMany({ _id: { $in: [inProgressAttempt._id, submittedAttempt._id, autoSubmittedAttempt._id, zeroMarksAttempt._id] } });
  await Question.deleteMany({ exam: { $in: [testExam._id, zeroMarksExam._id] } });
  await Exam.deleteMany({ _id: { $in: [testExam._id, zeroMarksExam._id] } });

  await mongoose.disconnect();

  console.log('\n--- Phase 6A Result Route & Controller Test Results ---');
  tests.forEach((t) => console.log(t));

  const hasFailures = tests.some((t) => t.startsWith('❌'));
  if (hasFailures) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests().catch((err) => {
  console.error('Result test failed with error:', err);
  process.exit(1);
});
