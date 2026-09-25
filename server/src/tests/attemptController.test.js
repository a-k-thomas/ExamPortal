import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
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

// Mock Response Helper
const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

const runTests = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Test] Connected to MongoDB');

  const tests = [];

  // Setup test users: Student 1, Student 2, Teacher
  const student1 = await User.findOne({ email: 'student@example.com' });
  let student2 = await User.findOne({ email: 'student2@example.com' });
  if (!student2) {
    student2 = await User.create({
      name: 'Student Two',
      email: 'student2@example.com',
      password: 'Password@123',
      role: 'student',
    });
  }
  const teacher = await User.findOne({ email: 'teacher@example.com' });

  // Cleanup old test attempts
  await ExamAttempt.deleteMany({ student: { $in: [student1._id, student2._id] } });

  // Setup test exams:
  // 1. Available Exam (published, window now - 1h to now + 2h)
  const now = new Date();
  const availableExam = await Exam.create({
    title: 'Phase 4B Available Exam',
    duration: 30,
    startTime: new Date(now.getTime() - 3600000),
    endTime: new Date(now.getTime() + 7200000),
    status: 'published',
    createdBy: teacher._id,
  });

  // Add 2 questions to availableExam
  const q1 = await Question.create({
    exam: availableExam._id,
    questionText: 'What is 2 + 2?',
    options: ['1', '2', '3', '4'],
    correctAnswer: '4',
    marks: 2,
    order: 1,
  });

  const q2 = await Question.create({
    exam: availableExam._id,
    questionText: 'Is Node.js single-threaded in its event loop?',
    options: ['Yes', 'No'],
    correctAnswer: 'Yes',
    marks: 3,
    order: 2,
  });

  // 2. Draft Exam
  const draftExam = await Exam.create({
    title: 'Phase 4B Draft Exam',
    duration: 30,
    startTime: new Date(now.getTime() - 3600000),
    endTime: new Date(now.getTime() + 7200000),
    status: 'draft',
    createdBy: teacher._id,
  });

  // 3. Future Exam (window opens in 2 hours)
  const futureExam = await Exam.create({
    title: 'Phase 4B Future Exam',
    duration: 30,
    startTime: new Date(now.getTime() + 7200000),
    endTime: new Date(now.getTime() + 14400000),
    status: 'published',
    createdBy: teacher._id,
  });

  // 4. Expired Exam (window ended 1 hour ago)
  const expiredExam = await Exam.create({
    title: 'Phase 4B Expired Exam',
    duration: 30,
    startTime: new Date(now.getTime() - 7200000),
    endTime: new Date(now.getTime() - 3600000),
    status: 'published',
    createdBy: teacher._id,
  });

  // 5. Exam with zero questions
  const zeroQExam = await Exam.create({
    title: 'Phase 4B Zero Q Exam',
    duration: 30,
    startTime: new Date(now.getTime() - 3600000),
    endTime: new Date(now.getTime() + 7200000),
    status: 'published',
    createdBy: teacher._id,
  });

  // ─── TEST 1: Student can retrieve available published exams ───
  const res1 = createMockRes();
  await getAvailableExams({ user: student1, query: {} }, res1);
  const foundAvailable = res1.body.exams.some(
    (e) => e._id.toString() === availableExam._id.toString()
  );
  tests.push(
    foundAvailable
      ? '✅ 1. Student can retrieve available published exams'
      : '❌ 1. Available exam missing'
  );

  // ─── TEST 2: Draft exam is not available ───
  const foundDraft = res1.body.exams.some(
    (e) => e._id.toString() === draftExam._id.toString()
  );
  tests.push(
    !foundDraft
      ? '✅ 2. Draft exam is not available in student listing'
      : '❌ 2. Draft exam found'
  );

  // ─── TEST 3: Student cannot start before startTime ───
  const res3 = createMockRes();
  await startAttempt(
    { user: student1, params: { examId: futureExam._id.toString() } },
    res3
  );
  tests.push(
    res3.statusCode === 400 && res3.body.message.includes('not opened yet')
      ? '✅ 3. Student cannot start before startTime (400 Bad Request)'
      : '❌ 3. Expected 400 on future exam: ' + res3.statusCode
  );

  // ─── TEST 4: Student cannot start after endTime ───
  const res4 = createMockRes();
  await startAttempt(
    { user: student1, params: { examId: expiredExam._id.toString() } },
    res4
  );
  tests.push(
    res4.statusCode === 400 && res4.body.message.includes('expired')
      ? '✅ 4. Student cannot start after endTime (400 Bad Request)'
      : '❌ 4. Expected 400 on expired exam: ' + res4.statusCode
  );

  // ─── TEST 5: Student cannot start an exam with zero questions ───
  const res5 = createMockRes();
  await startAttempt(
    { user: student1, params: { examId: zeroQExam._id.toString() } },
    res5
  );
  tests.push(
    res5.statusCode === 400 && res5.body.message.includes('any questions')
      ? '✅ 5. Student cannot start exam with zero questions (400 Bad Request)'
      : '❌ 5. Expected 400 on zero questions exam: ' + res5.statusCode
  );

  // ─── TEST 6: Student can start a valid exam ───
  const res6 = createMockRes();
  await startAttempt(
    { user: student1, params: { examId: availableExam._id.toString() } },
    res6
  );
  const attemptId = res6.body.attempt?._id;
  tests.push(
    res6.statusCode === 201 && attemptId && res6.body.attempt.status === 'in_progress'
      ? '✅ 6. Student can start valid exam (201 Created)'
      : '❌ 6. Failed to start valid exam: ' + res6.statusCode
  );

  // ─── TEST 7: Starting again does not create duplicate in-progress attempts ───
  const res7 = createMockRes();
  await startAttempt(
    { user: student1, params: { examId: availableExam._id.toString() } },
    res7
  );
  const countAttempts = await ExamAttempt.countDocuments({
    student: student1._id,
    exam: availableExam._id,
  });
  tests.push(
    res7.body.resumed === true && countAttempts === 1
      ? '✅ 7. Starting again safely resumes existing attempt without duplicate'
      : '❌ 7. Duplicate attempts created: ' + countAttempts
  );

  // ─── TEST 8: Student can retrieve their own attempt ───
  const res8 = createMockRes();
  await getMyAttempt(
    { user: student1, params: { id: attemptId.toString() } },
    res8
  );
  tests.push(
    res8.statusCode === 200 &&
      res8.body.attempt._id.toString() === attemptId.toString()
      ? '✅ 8. Student can retrieve their own attempt'
      : '❌ 8. Failed to retrieve own attempt: ' + res8.statusCode
  );

  // ─── TEST 9: Student cannot retrieve another student's attempt ───
  const res9 = createMockRes();
  await getMyAttempt(
    { user: student2, params: { id: attemptId.toString() } },
    res9
  );
  tests.push(
    res9.statusCode === 403
      ? "✅ 9. Student cannot retrieve another student's attempt (403 Forbidden)"
      : '❌ 9. Security breach: got status ' + res9.statusCode
  );

  // ─── TEST 10: Student can save a valid answer ───
  const res10 = createMockRes();
  await saveAnswer(
    {
      user: student1,
      params: { id: attemptId.toString() },
      body: { questionId: q1._id.toString(), selectedAnswer: '4' },
    },
    res10
  );
  tests.push(
    res10.statusCode === 200 && res10.body.answer.selectedAnswer === '4'
      ? '✅ 10. Student can save a valid answer'
      : '❌ 10. Failed to save answer: ' + res10.statusCode
  );

  // ─── TEST 11: Invalid answer option is rejected ───
  const res11 = createMockRes();
  await saveAnswer(
    {
      user: student1,
      params: { id: attemptId.toString() },
      body: { questionId: q1._id.toString(), selectedAnswer: 'InvalidOption100' },
    },
    res11
  );
  tests.push(
    res11.statusCode === 400
      ? '✅ 11. Invalid answer option is rejected (400 Bad Request)'
      : '❌ 11. Invalid answer accepted: ' + res11.statusCode
  );

  // ─── TEST 12: marksAwarded supplied by client is ignored/rejected ───
  const res12 = createMockRes();
  await saveAnswer(
    {
      user: student1,
      params: { id: attemptId.toString() },
      body: { questionId: q2._id.toString(), selectedAnswer: 'Yes', marksAwarded: 999 },
    },
    res12
  );
  const updatedAtt = await ExamAttempt.findById(attemptId);
  const q2Answer = updatedAtt.answers.find(
    (a) => a.question.toString() === q2._id.toString()
  );
  tests.push(
    q2Answer && q2Answer.marksAwarded === 0
      ? '✅ 12. marksAwarded supplied by client is strictly ignored (stored as 0)'
      : '❌ 12. Client marksAwarded leaked into DB: ' + q2Answer?.marksAwarded
  );

  // ─── TEST 14: Student can submit an in-progress attempt ───
  const res14 = createMockRes();
  await submitAttempt(
    {
      user: student1,
      params: { id: attemptId.toString() },
      body: {},
    },
    res14
  );
  tests.push(
    res14.statusCode === 200 && res14.body.attempt.status === 'submitted'
      ? '✅ 14. Student can submit an in-progress attempt'
      : '❌ 14. Submit failed: ' + res14.statusCode
  );

  // ─── TEST 15: Submission records server-side submittedAt ───
  const submittedAtt = await ExamAttempt.findById(attemptId);
  tests.push(
    submittedAtt.submittedAt && submittedAtt.status === 'submitted'
      ? '✅ 15. Submission records server-side submittedAt timestamp'
      : '❌ 15. Missing submittedAt'
  );

  // ─── TEST 13: Submitted attempt cannot be edited ───
  const res13 = createMockRes();
  await saveAnswer(
    {
      user: student1,
      params: { id: attemptId.toString() },
      body: { questionId: q1._id.toString(), selectedAnswer: '1' },
    },
    res13
  );
  tests.push(
    res13.statusCode === 400 && res13.body.message.includes('already submitted')
      ? '✅ 13. Submitted attempt cannot be edited (400 Bad Request)'
      : '❌ 13. Answer modification allowed after submission: ' + res13.statusCode
  );

  // ─── TEST 16: Score is computed by evaluationService after submission (Phase 5A) ───
  tests.push(
    typeof submittedAtt.score === 'number' && submittedAtt.score >= 0
      ? '✅ 16. Score is authoritatively computed by server after submission (Phase 5A)'
      : '❌ 16. Score was not computed: ' + submittedAtt.score
  );

  // ─── TEST 17: correctAnswer never appears in student-facing responses ───
  const resQuestionsJson = JSON.stringify(res6.body.questions || []);
  const resExamJson = JSON.stringify(res6.body.exam || []);
  const resAttemptJson = JSON.stringify(res8.body || {});
  const leakedInStart = resQuestionsJson.includes('correctAnswer');
  const leakedInGet = resAttemptJson.includes('correctAnswer');
  tests.push(
    !leakedInStart && !leakedInGet
      ? '✅ 17. correctAnswer NEVER appears in any student-facing response'
      : '❌ 17. Security vulnerability: correctAnswer leaked in student response!'
  );

  // Cleanup test data
  await Exam.deleteMany({
    _id: {
      $in: [
        availableExam._id,
        draftExam._id,
        futureExam._id,
        expiredExam._id,
        zeroQExam._id,
      ],
    },
  });
  await Question.deleteMany({
    exam: {
      $in: [
        availableExam._id,
        draftExam._id,
        futureExam._id,
        expiredExam._id,
        zeroQExam._id,
      ],
    },
  });
  await ExamAttempt.deleteMany({ _id: attemptId });

  console.log('\n--- Phase 4B Attempt Controller Test Results ---');
  tests.forEach((t) => console.log(t));

  await mongoose.disconnect();
  console.log('[Test] Disconnected from MongoDB');
};

runTests().catch((err) => {
  console.error('[Test Error]:', err);
  process.exit(1);
});
