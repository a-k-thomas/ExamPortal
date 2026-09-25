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
  console.log('[Test] Connected to MongoDB for Phase 6B Reporting Tests');

  const tests = [];

  // Setup test users:
  // - Teacher 1 (owns exam 1)
  // - Teacher 2 (owns exam 2)
  // - Admin
  // - Student
  let teacher1 = await User.findOne({ email: 'teacher@example.com' });
  let teacher2 = await User.findOne({ email: 'teacher2@example.com' });
  if (!teacher2) {
    teacher2 = await User.create({
      name: 'Teacher Two',
      email: 'teacher2@example.com',
      password: 'Teacher@123',
      role: 'teacher',
    });
  }

  let admin = await User.findOne({ email: 'admin@example.com' });
  let student = await User.findOne({ email: 'student@example.com' });

  // Login tokens
  const getToken = async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      // Fix password if needed
      const u = await User.findOne({ email });
      if (u) {
        u.password = password;
        await u.save();
        const retryRes = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const d = await retryRes.json();
        return d.token;
      }
    }
    const data = await res.json();
    return data.token;
  };

  const teacher1Token = await getToken('teacher@example.com', 'Teacher@123');
  const teacher2Token = await getToken('teacher2@example.com', 'Teacher@123');
  const adminToken = await getToken('admin@example.com', 'Admin@123');
  const studentToken = await getToken('student@example.com', 'Student@123');

  const teacher1Headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${teacher1Token}` };
  const teacher2Headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${teacher2Token}` };
  const adminHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };
  const studentHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` };

  const now = new Date();

  // Create Exam 1 owned by Teacher 1
  const exam1 = await Exam.create({
    title: 'Report Test Exam 1',
    duration: 60,
    startTime: new Date(now.getTime() - 3600000),
    endTime: new Date(now.getTime() + 7200000),
    status: 'published',
    createdBy: teacher1._id,
  });

  // Create Questions for Exam 1
  const q1 = await Question.create({
    exam: exam1._id,
    questionText: 'Capital of France?',
    options: ['Paris', 'London', 'Berlin'],
    correctAnswer: 'Paris',
    marks: 10,
    order: 1,
  });

  const q2 = await Question.create({
    exam: exam1._id,
    questionText: 'Capital of Japan?',
    options: ['Tokyo', 'Kyoto', 'Osaka'],
    correctAnswer: 'Tokyo',
    marks: 10,
    order: 2,
  });

  // Create Exam 2 owned by Teacher 2
  const exam2 = await Exam.create({
    title: 'Report Test Exam 2',
    duration: 30,
    startTime: new Date(now.getTime() - 3600000),
    endTime: new Date(now.getTime() + 7200000),
    status: 'published',
    createdBy: teacher2._id,
  });

  // Create Attempts on Exam 1:
  // Attempt A: Scored 20/20 (100% - Pass)
  const attemptA = await ExamAttempt.create({
    exam: exam1._id,
    student: student._id,
    status: 'submitted',
    startedAt: new Date(now.getTime() - 30000),
    submittedAt: new Date(now.getTime() - 10000),
    totalMarks: 20,
    score: 20,
    answers: [
      { question: q1._id, selectedAnswer: 'Paris', marksAwarded: 10 },
      { question: q2._id, selectedAnswer: 'Tokyo', marksAwarded: 10 },
    ],
  });

  // Attempt B: Scored 0/20 (0% - Fail)
  const attemptB = await ExamAttempt.create({
    exam: exam1._id,
    student: student._id,
    status: 'auto_submitted',
    startedAt: new Date(now.getTime() - 25000),
    submittedAt: new Date(now.getTime() - 5000),
    totalMarks: 20,
    score: 0,
    answers: [
      { question: q1._id, selectedAnswer: 'London', marksAwarded: 0 },
      { question: q2._id, selectedAnswer: null, marksAwarded: 0 },
    ],
  });

  // Attempt C: In Progress
  const attemptC = await ExamAttempt.create({
    exam: exam1._id,
    student: student._id,
    status: 'in_progress',
    startedAt: new Date(now.getTime() - 5000),
    totalMarks: 20,
    score: 0,
    answers: [],
  });

  // ─── TEST 1: Unauthenticated request is rejected (401) ───
  const res1 = await fetch(`${BASE_URL}/reports/exams/${exam1._id}`);
  tests.push(
    res1.status === 401
      ? '✅ 1. Unauthenticated request to reports is rejected (401 Unauthorized)'
      : '❌ 1. Expected 401, got ' + res1.status
  );

  // ─── TEST 2: Student is rejected from teacher/admin reporting (403) ───
  const res2 = await fetch(`${BASE_URL}/reports/exams/${exam1._id}`, {
    headers: studentHeaders,
  });
  tests.push(
    res2.status === 403
      ? '✅ 2. Student is rejected from accessing reports (403 Forbidden)'
      : '❌ 2. Expected 403 for student accessing reports, got ' + res2.status
  );

  // ─── TEST 3: Teacher can access report for their own exam (200) ───
  const res3 = await fetch(`${BASE_URL}/reports/exams/${exam1._id}`, {
    headers: teacher1Headers,
  });
  const data3 = await res3.json();
  const r3 = data3.report;
  const test3Passed =
    res3.status === 200 &&
    data3.success === true &&
    r3 &&
    r3.exam._id === exam1._id.toString() &&
    r3.statistics.totalAttempts === 3 &&
    r3.statistics.completedAttempts === 2 &&
    r3.statistics.inProgressAttempts === 1 &&
    r3.statistics.averageScore === 10 &&
    r3.statistics.highestScore === 20 &&
    r3.statistics.lowestScore === 0 &&
    r3.statistics.passCount === 1 &&
    r3.statistics.failCount === 1 &&
    r3.statistics.passPercentage === 50;
  tests.push(
    test3Passed
      ? '✅ 3. Teacher can access report for their own exam with accurate statistics'
      : `❌ 3. Teacher report failed: ${res3.status} ${JSON.stringify(data3)}`
  );

  // ─── TEST 4: Teacher CANNOT access another teacher's exam report (403) ───
  const res4 = await fetch(`${BASE_URL}/reports/exams/${exam2._id}`, {
    headers: teacher1Headers,
  });
  tests.push(
    res4.status === 403
      ? '✅ 4. Teacher is blocked from accessing another teacher exam report (403 Forbidden)'
      : '❌ 4. Expected 403 for cross-teacher access, got ' + res4.status
  );

  // ─── TEST 5: Admin can access any exam report (200) ───
  const res5 = await fetch(`${BASE_URL}/reports/exams/${exam2._id}`, {
    headers: adminHeaders,
  });
  tests.push(
    res5.status === 200
      ? '✅ 5. Admin can access any exam report (200 OK)'
      : '❌ 5. Expected 200 for admin accessing exam report, got ' + res5.status
  );

  // ─── TEST 6: Student performance report returns sorted, accurate student list ───
  const res6 = await fetch(`${BASE_URL}/reports/exams/${exam1._id}/students?sortBy=score&sortOrder=desc`, {
    headers: teacher1Headers,
  });
  const data6 = await res6.json();
  const test6Passed =
    res6.status === 200 &&
    data6.success === true &&
    Array.isArray(data6.students) &&
    data6.students.length === 3 &&
    data6.students[0].score === 20 &&
    data6.students[0].percentage === 100 &&
    data6.students[0].correctAnswers === 2;
  tests.push(
    test6Passed
      ? '✅ 6. Student performance report returns accurate student metrics with sorting'
      : `❌ 6. Student performance report failed: ${res6.status} ${JSON.stringify(data6)}`
  );

  // ─── TEST 7: Question performance report calculates accuracy and option distribution ───
  const res7 = await fetch(`${BASE_URL}/reports/exams/${exam1._id}/questions`, {
    headers: teacher1Headers,
  });
  const data7 = await res7.json();
  const qPerf = data7.report?.questions;
  const q1Perf = qPerf?.find((qp) => qp.questionId === q1._id.toString());
  const test7Passed =
    res7.status === 200 &&
    qPerf &&
    qPerf.length === 2 &&
    q1Perf &&
    q1Perf.correctResponses === 1 &&
    q1Perf.incorrectResponses === 1 &&
    q1Perf.accuracyPercentage === 50 &&
    q1Perf.optionDistribution['Paris'] === 1 &&
    q1Perf.optionDistribution['London'] === 1;
  tests.push(
    test7Passed
      ? '✅ 7. Question performance report calculates accuracy and option distribution'
      : `❌ 7. Question performance report failed: ${res7.status} ${JSON.stringify(data7)}`
  );

  // ─── TEST 8: Admin system overview endpoint returns platform-wide metrics ───
  const res8 = await fetch(`${BASE_URL}/reports/admin/overview`, {
    headers: adminHeaders,
  });
  const data8 = await res8.json();
  const overview = data8.overview;
  const test8Passed =
    res8.status === 200 &&
    overview &&
    overview.totalExams >= 2 &&
    overview.totalAttempts >= 3 &&
    overview.completedAttempts >= 2;
  tests.push(
    test8Passed
      ? '✅ 8. Admin system overview returns valid aggregate platform metrics'
      : `❌ 8. Admin overview failed: ${res8.status} ${JSON.stringify(data8)}`
  );

  // ─── TEST 9: Admin exams report lists exams with aggregate summaries ───
  const res9 = await fetch(`${BASE_URL}/reports/admin/exams`, {
    headers: adminHeaders,
  });
  const data9 = await res9.json();
  const test9Passed =
    res9.status === 200 &&
    Array.isArray(data9.exams) &&
    data9.exams.some((e) => e.examId === exam1._id.toString());
  tests.push(
    test9Passed
      ? '✅ 9. Admin exams report lists exams with performance statistics'
      : `❌ 9. Admin exams report failed: ${res9.status} ${JSON.stringify(data9)}`
  );

  // ─── TEST 10: Teacher overview returns their exams report ───
  const res10 = await fetch(`${BASE_URL}/reports/teacher/overview`, {
    headers: teacher1Headers,
  });
  const data10 = await res10.json();
  const test10Passed =
    res10.status === 200 &&
    data10.report?.exams &&
    data10.report.exams.some((e) => e.examId === exam1._id.toString()) &&
    !data10.report.exams.some((e) => e.examId === exam2._id.toString());
  tests.push(
    test10Passed
      ? '✅ 10. Teacher overview includes only their own exams'
      : `❌ 10. Teacher overview failed: ${res10.status} ${JSON.stringify(data10)}`
  );

  // ─── TEST 11: Empty exam / 0 attempts handled safely without errors ───
  const emptyExam = await Exam.create({
    title: 'Empty Report Test Exam',
    duration: 30,
    startTime: new Date(now.getTime() - 3600000),
    endTime: new Date(now.getTime() + 7200000),
    status: 'published',
    createdBy: teacher1._id,
  });

  const res11 = await fetch(`${BASE_URL}/reports/exams/${emptyExam._id}`, {
    headers: teacher1Headers,
  });
  const data11 = await res11.json();
  const test11Passed =
    res11.status === 200 &&
    data11.report.statistics.totalAttempts === 0 &&
    data11.report.statistics.averageScore === 0 &&
    data11.report.statistics.passPercentage === 0;
  tests.push(
    test11Passed
      ? '✅ 11. Empty exam with zero attempts is safely handled (zero averages, no crash)'
      : `❌ 11. Empty exam handling failed: ${res11.status} ${JSON.stringify(data11)}`
  );

  // ─── TEST 12: Invalid exam ID returns 400 ───
  const res12 = await fetch(`${BASE_URL}/reports/exams/not-a-valid-id`, {
    headers: teacher1Headers,
  });
  tests.push(
    res12.status === 400
      ? '✅ 12. Invalid exam ID format returns 400 Bad Request'
      : '❌ 12. Expected 400 for invalid ID, got ' + res12.status
  );

  // Cleanup test data
  await ExamAttempt.deleteMany({ _id: { $in: [attemptA._id, attemptB._id, attemptC._id] } });
  await Question.deleteMany({ exam: { $in: [exam1._id, exam2._id, emptyExam._id] } });
  await Exam.deleteMany({ _id: { $in: [exam1._id, exam2._id, emptyExam._id] } });

  await mongoose.disconnect();

  console.log('\n--- Phase 6B Reporting Test Results ---');
  tests.forEach((t) => console.log(t));

  const hasFailures = tests.some((t) => t.startsWith('❌'));
  if (hasFailures) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests().catch((err) => {
  console.error('Report tests fatal error:', err);
  process.exit(1);
});
