import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import ExamAttempt from '../models/ExamAttempt.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online-exam-portal';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_12345';
const BASE_URL = 'http://localhost:5000/api';

const generateToken = (userId, role) => jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });

async function runTests() {
  await mongoose.connect(MONGODB_URI);
  console.log('[Test] Connected to MongoDB for Result Review & Explanation Verification');

  const tests = [];
  let testExam = null;
  let attemptId = null;

  try {
    const student = await User.findOne({ role: 'student' });
    const teacher = await User.findOne({ role: 'teacher' });

    if (!student || !teacher) {
      throw new Error('Required seed users (student, teacher) not found');
    }

    const studentToken = generateToken(student._id, student.role);
    const teacherToken = generateToken(teacher._id, teacher.role);

    const teacherHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${teacherToken}`,
    };
    const studentHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    };

    // Create a dedicated test exam
    testExam = await Exam.create({
      title: 'Result Review & Explanations Verification Exam',
      description: 'Comprehensive test covering 18 requirements for question explanations and result scorecard review.',
      instructions: 'Answer all questions.',
      duration: 30,
      startTime: new Date(Date.now() - 10 * 60 * 1000),
      endTime: new Date(Date.now() + 60 * 60 * 1000),
      status: 'draft',
      createdBy: teacher._id,
    });

    // ─── 1. Question creation WITH explanation ───
    const q1Res = await fetch(`${BASE_URL}/questions/exam/${testExam._id}`, {
      method: 'POST',
      headers: teacherHeaders,
      body: JSON.stringify({
        questionType: 'SINGLE_CHOICE',
        questionText: 'What is the speed of light in vacuum?',
        options: ['300,000 km/s', '150,000 km/s', '3,000 km/s', '1,000 km/s'],
        correctAnswer: '300,000 km/s',
        marks: 5,
        explanation: 'The speed of light in vacuum is approximately 299,792 km/s, commonly rounded to 300,000 km/s.',
      }),
    });
    const q1Data = await q1Res.json();
    const q1Obj = q1Data.question;
    const q1Db = await Question.findById(q1Obj?._id);

    tests.push(
      q1Res.status === 201 &&
        q1Obj?.explanation?.includes('299,792 km/s') &&
        q1Db?.explanation?.includes('299,792 km/s')
        ? '✅ 1. Question creation WITH explanation works (saved in DB, returned in teacher response)'
        : `❌ 1. Creation with explanation failed: ${q1Res.status} ${JSON.stringify(q1Data)}`
    );

    // ─── 2. Question creation WITHOUT explanation ───
    const q2Res = await fetch(`${BASE_URL}/questions/exam/${testExam._id}`, {
      method: 'POST',
      headers: teacherHeaders,
      body: JSON.stringify({
        questionType: 'MULTIPLE_SELECT',
        questionText: 'Which of the following are primary colors of light?',
        options: ['Red', 'Green', 'Blue', 'Yellow'],
        correctAnswers: ['Blue', 'Green', 'Red'],
        marks: 5,
      }),
    });
    const q2Data = await q2Res.json();
    const q2Obj = q2Data.question;
    const q2Db = await Question.findById(q2Obj?._id);

    tests.push(
      q2Res.status === 201 &&
        (q2Obj?.explanation === '' || q2Obj?.explanation === undefined) &&
        (q2Db?.explanation === '' || q2Db?.explanation === undefined)
        ? '✅ 2. Question creation WITHOUT explanation works (defaults to empty string, no error)'
        : `❌ 2. Creation without explanation failed: ${q2Res.status} ${JSON.stringify(q2Data)}`
    );

    // Create remaining questions (TRUE_FALSE and SHORT_ANSWER)
    const q3Res = await fetch(`${BASE_URL}/questions/exam/${testExam._id}`, {
      method: 'POST',
      headers: teacherHeaders,
      body: JSON.stringify({
        questionType: 'TRUE_FALSE',
        questionText: 'Water boils at 100 degrees Celsius at 1 atm pressure.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        marks: 5,
        explanation: 'At standard atmospheric pressure (1 atm), the boiling point of pure water is 100 degrees C.',
      }),
    });
    const q3Data = await q3Res.json();
    const q3Obj = q3Data.question;

    const q4Res = await fetch(`${BASE_URL}/questions/exam/${testExam._id}`, {
      method: 'POST',
      headers: teacherHeaders,
      body: JSON.stringify({
        questionType: 'SHORT_ANSWER',
        questionText: 'What is the chemical formula of carbon dioxide?',
        acceptedAnswers: ['CO2', 'CO 2'],
        marks: 5,
        explanation: 'Carbon dioxide consists of one carbon atom covalently double-bonded to two oxygen atoms (CO2).',
      }),
    });
    const q4Data = await q4Res.json();
    const q4Obj = q4Data.question;

    // ─── 3. Question update: add an explanation to an existing question (q2) ───
    const q2UpdateRes = await fetch(`${BASE_URL}/questions/${q2Obj._id}`, {
      method: 'PUT',
      headers: teacherHeaders,
      body: JSON.stringify({
        explanation: 'RGB (Red, Green, Blue) are the additive primary colors of light.',
      }),
    });
    const q2UpdateData = await q2UpdateRes.json();
    const q2UpdatedDb = await Question.findById(q2Obj._id);

    tests.push(
      q2UpdateRes.status === 200 &&
        q2UpdateData.question?.explanation?.includes('additive primary colors') &&
        q2UpdatedDb?.explanation?.includes('additive primary colors')
        ? '✅ 3. Question update: add an explanation to an existing question works'
        : `❌ 3. Add explanation on update failed: ${q2UpdateRes.status} ${JSON.stringify(q2UpdateData)}`
    );

    // ─── 4. Question update: modify an existing explanation (q1) ───
    const q1UpdateRes = await fetch(`${BASE_URL}/questions/${q1Obj._id}`, {
      method: 'PUT',
      headers: teacherHeaders,
      body: JSON.stringify({
        explanation: 'Updated: Light travels at exactly 299,792,458 meters per second in a vacuum.',
      }),
    });
    const q1UpdateData = await q1UpdateRes.json();
    const q1UpdatedDb = await Question.findById(q1Obj._id);

    tests.push(
      q1UpdateRes.status === 200 &&
        q1UpdateData.question?.explanation?.includes('299,792,458 meters') &&
        q1UpdatedDb?.explanation?.includes('299,792,458 meters')
        ? '✅ 4. Question update: modify an existing explanation works'
        : `❌ 4. Modify explanation failed: ${q1UpdateRes.status} ${JSON.stringify(q1UpdateData)}`
    );

    // ─── 5. Question update: clear/remove an explanation (q1) ───
    const q1ClearRes = await fetch(`${BASE_URL}/questions/${q1Obj._id}`, {
      method: 'PUT',
      headers: teacherHeaders,
      body: JSON.stringify({
        explanation: '',
      }),
    });
    const q1ClearData = await q1ClearRes.json();
    const q1ClearedDb = await Question.findById(q1Obj._id);

    tests.push(
      q1ClearRes.status === 200 &&
        q1ClearData.question?.explanation === '' &&
        q1ClearedDb?.explanation === ''
        ? '✅ 5. Question update: clear/remove an explanation works'
        : `❌ 5. Clear explanation failed: ${q1ClearRes.status} ${JSON.stringify(q1ClearData)}`
    );

    // Re-add an explanation to q1 so we can test it in results
    await Question.findByIdAndUpdate(q1Obj._id, {
      explanation: 'The speed of light in vacuum is exactly 299,792,458 m/s.',
    });

    // Publish exam for student attempt
    testExam.status = 'published';
    await testExam.save();

    // ─── 6. SECURITY: Active attempt (startAttempt / getMyAttempt) explanation projection ───
    const startRes = await fetch(`${BASE_URL}/attempts/exams/${testExam._id}/start`, {
      method: 'POST',
      headers: studentHeaders,
    });
    const startData = await startRes.json();
    attemptId = startData.attempt?._id;

    const getAttemptRes = await fetch(`${BASE_URL}/attempts/${attemptId}`, {
      headers: studentHeaders,
    });
    const getAttemptData = await getAttemptRes.json();

    const startQuestions = startData.questions || [];
    const getQuestions = getAttemptData.questions || [];

    const activeLeaksExplanation =
      startQuestions.some((q) => q.explanation !== undefined) ||
      getQuestions.some((q) => q.explanation !== undefined) ||
      JSON.stringify(startQuestions).includes('299,792') ||
      JSON.stringify(getQuestions).includes('299,792');

    tests.push(
      !activeLeaksExplanation
        ? '✅ 6. SECURITY: Active attempt (startAttempt / getMyAttempt) does NOT expose explanation'
        : '❌ 6. Active attempt leaked question explanation!'
    );

    // ─── 7. SECURITY: Active attempt saveAnswer response does NOT expose explanation ───
    const saveAnsRes = await fetch(`${BASE_URL}/attempts/${attemptId}/answer`, {
      method: 'PATCH',
      headers: studentHeaders,
      body: JSON.stringify({
        questionId: q1Obj._id,
        selectedAnswer: '300,000 km/s',
      }),
    });
    const saveAnsData = await saveAnsRes.json();
    const savePayloadStr = JSON.stringify(saveAnsData);

    tests.push(
      !savePayloadStr.includes('explanation') && !savePayloadStr.includes('299,792')
        ? '✅ 7. SECURITY: Active attempt saveAnswer response does NOT expose explanation'
        : '❌ 7. saveAnswer response leaked question explanation!'
    );

    // ─── 8. SECURITY: Active attempt does NOT expose correctAnswer, correctAnswers, acceptedAnswers ───
    const activeQuestionsLeakAnswers =
      startQuestions.some(
        (q) => q.correctAnswer !== undefined || q.correctAnswers !== undefined || q.acceptedAnswers !== undefined
      ) ||
      getQuestions.some(
        (q) => q.correctAnswer !== undefined || q.correctAnswers !== undefined || q.acceptedAnswers !== undefined
      ) ||
      savePayloadStr.includes('correctAnswer') ||
      savePayloadStr.includes('correctAnswers') ||
      savePayloadStr.includes('acceptedAnswers');

    tests.push(
      !activeQuestionsLeakAnswers
        ? '✅ 8. SECURITY: Active attempt does NOT expose correctAnswer, correctAnswers, or acceptedAnswers'
        : '❌ 8. Active attempt leaked correct answers!'
    );

    // Save answers for student:
    // q1 (SINGLE_CHOICE): Correct ('300,000 km/s') -> already saved above
    // q2 (MULTIPLE_SELECT): Incorrect (only ['Red', 'Yellow'])
    await fetch(`${BASE_URL}/attempts/${attemptId}/answer`, {
      method: 'PATCH',
      headers: studentHeaders,
      body: JSON.stringify({
        questionId: q2Obj._id,
        selectedAnswer: ['Red', 'Yellow'],
      }),
    });

    // q3 (TRUE_FALSE): Left UNANSWERED (do not save any answer)

    // q4 (SHORT_ANSWER): Correct ('co2' with extra whitespace)
    await fetch(`${BASE_URL}/attempts/${attemptId}/answer`, {
      method: 'PATCH',
      headers: studentHeaders,
      body: JSON.stringify({
        questionId: q4Obj._id,
        selectedAnswer: '  cO2  ',
      }),
    });

    // Submit attempt
    const submitRes = await fetch(`${BASE_URL}/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: studentHeaders,
    });
    const submitData = await submitRes.json();

    // Retrieve completed Result Review
    const resultRes = await fetch(`${BASE_URL}/attempts/${attemptId}/result`, {
      headers: studentHeaders,
    });
    const resultData = await resultRes.json();
    const resultPayload = resultData.result;
    const questionsReview = resultPayload?.questions || [];

    // ─── 9. Result after submission: questions array IS present ───
    tests.push(
      resultRes.status === 200 && Array.isArray(questionsReview) && questionsReview.length === 4
        ? '✅ 9. Result after submission: questions array IS present with all exam questions'
        : `❌ 9. Result questions array missing or incorrect: ${resultRes.status} count=${questionsReview.length}`
    );

    // ─── 10. Result after submission: explanation IS present for questions that have one ───
    const revQ1 = questionsReview.find((q) => String(q.questionId) === String(q1Obj._id));
    const revQ4 = questionsReview.find((q) => String(q.questionId) === String(q4Obj._id));

    tests.push(
      revQ1?.explanation?.includes('299,792,458') && revQ4?.explanation?.includes('Carbon dioxide consists')
        ? '✅ 10. Result after submission: explanation IS present for questions that have one'
        : `❌ 10. Explanation missing in result review: Q1=${revQ1?.explanation}, Q4=${revQ4?.explanation}`
    );

    // ─── 11. Result after submission: explanation is empty/omitted gracefully for questions without one ───
    // Temporarily clear explanation on Q2 and re-check
    await Question.findByIdAndUpdate(q2Obj._id, { explanation: '' });
    const freshRes = await fetch(`${BASE_URL}/attempts/${attemptId}/result`, {
      headers: studentHeaders,
    });
    const freshData = await freshRes.json();
    const freshRevQ2 = freshData.result?.questions?.find((q) => String(q.questionId) === String(q2Obj._id));

    tests.push(
      freshRevQ2?.explanation === '' || freshRevQ2?.explanation === undefined
        ? '✅ 11. Result after submission: explanation is empty/omitted gracefully when not provided'
        : `❌ 11. Expected empty explanation, got: ${freshRevQ2?.explanation}`
    );

    // ─── 12. Result after submission: correctAnswer / correctAnswers / acceptedAnswers ARE present for review ───
    const revQ2 = questionsReview.find((q) => String(q.questionId) === String(q2Obj._id));
    const revQ3 = questionsReview.find((q) => String(q.questionId) === String(q3Obj._id));

    const hasCorrectKeys =
      revQ1?.correctAnswer === '300,000 km/s' &&
      Array.isArray(revQ2?.correctAnswers) &&
      revQ2.correctAnswers.includes('Red') &&
      revQ3?.correctAnswer === 'True' &&
      Array.isArray(revQ4?.acceptedAnswers) &&
      revQ4.acceptedAnswers.includes('CO2');

    tests.push(
      hasCorrectKeys
        ? '✅ 12. Result after submission: correctAnswer / correctAnswers / acceptedAnswers ARE present for review'
        : `❌ 12. Correct answer keys missing or malformed in review payload: Q1=${revQ1?.correctAnswer}, Q2=${JSON.stringify(revQ2?.correctAnswers)}, Q3=${revQ3?.correctAnswer}, Q4=${JSON.stringify(revQ4?.acceptedAnswers)}`
    );

    // ─── 13. Result review: SINGLE_CHOICE question includes studentAnswer, correctAnswer, status, marksAwarded ───
    tests.push(
      revQ1?.questionType === 'SINGLE_CHOICE' &&
        revQ1.studentAnswer === '300,000 km/s' &&
        revQ1.correctAnswer === '300,000 km/s' &&
        revQ1.status === 'CORRECT' &&
        revQ1.isCorrect === true &&
        revQ1.marksAwarded === 5 &&
        revQ1.maxMarks === 5
        ? '✅ 13. Result review: SINGLE_CHOICE includes studentAnswer, correctAnswer, status (CORRECT), marksAwarded'
        : `❌ 13. SINGLE_CHOICE review mismatch: ${JSON.stringify(revQ1)}`
    );

    // ─── 14. Result review: MULTIPLE_SELECT question includes studentAnswer (array), correctAnswers (array), status, marksAwarded ───
    tests.push(
      revQ2?.questionType === 'MULTIPLE_SELECT' &&
        Array.isArray(revQ2.studentAnswer) &&
        Array.isArray(revQ2.correctAnswers) &&
        revQ2.status === 'INCORRECT' &&
        revQ2.isCorrect === false &&
        revQ2.marksAwarded === 0
        ? '✅ 14. Result review: MULTIPLE_SELECT includes studentAnswer array, correctAnswers array, status, marksAwarded'
        : `❌ 14. MULTIPLE_SELECT review mismatch: ${JSON.stringify(revQ2)}`
    );

    // ─── 15. Result review: TRUE_FALSE question includes studentAnswer, correctAnswer, status, marksAwarded ───
    // Q3 was unanswered
    tests.push(
      revQ3?.questionType === 'TRUE_FALSE' &&
        revQ3.status === 'UNANSWERED' &&
        revQ3.isUnanswered === true &&
        revQ3.correctAnswer === 'True'
        ? '✅ 15. Result review: TRUE_FALSE question includes correctAnswer and correct status'
        : `❌ 15. TRUE_FALSE review mismatch: ${JSON.stringify(revQ3)}`
    );

    // ─── 16. Result review: SHORT_ANSWER question includes studentAnswer (string), acceptedAnswers (array), status, marksAwarded ───
    tests.push(
      revQ4?.questionType === 'SHORT_ANSWER' &&
        typeof revQ4.studentAnswer === 'string' &&
        Array.isArray(revQ4.acceptedAnswers) &&
        revQ4.status === 'CORRECT' &&
        revQ4.isCorrect === true &&
        revQ4.marksAwarded === 5
        ? '✅ 16. Result review: SHORT_ANSWER question includes studentAnswer, acceptedAnswers, status, marksAwarded'
        : `❌ 16. SHORT_ANSWER review mismatch: ${JSON.stringify(revQ4)}`
    );

    // ─── 17. Result review: Unanswered question marked with status UNANSWERED, marksAwarded = 0, correct answer visible ───
    tests.push(
      revQ3?.status === 'UNANSWERED' &&
        revQ3.studentAnswer === null &&
        revQ3.marksAwarded === 0 &&
        revQ3.correctAnswer !== undefined
        ? '✅ 17. Result review: Unanswered question marked with UNANSWERED, marksAwarded = 0, correct answer visible'
        : `❌ 17. Unanswered question review check failed: ${JSON.stringify(revQ3)}`
    );

    // ─── 18. Result review: Marks awarded match server-authoritative evaluation (not client-provided) ───
    // Expected total awarded: Q1 (5) + Q2 (0) + Q3 (0) + Q4 (5) = 10 out of 20 = 50%
    const sumReviewMarks = questionsReview.reduce((sum, q) => sum + (q.marksAwarded || 0), 0);
    const sumMaxMarks = questionsReview.reduce((sum, q) => sum + (q.maxMarks || 0), 0);

    tests.push(
      resultPayload.score === 10 &&
        resultPayload.totalMarks === 20 &&
        resultPayload.percentage === 50 &&
        sumReviewMarks === 10 &&
        sumMaxMarks === 20
        ? '✅ 18. Result review: Marks awarded match server-authoritative evaluation (10/20, 50%)'
        : `❌ 18. Server-authoritative marks mismatch: score=${resultPayload.score}, sumReviewMarks=${sumReviewMarks}`
    );
  } catch (err) {
    tests.push(`❌ Test execution failed with exception: ${err.message}\n${err.stack}`);
  } finally {
    if (testExam) {
      await Question.deleteMany({ exam: testExam._id });
      await ExamAttempt.deleteMany({ exam: testExam._id });
      await Exam.findByIdAndDelete(testExam._id);
    }
    await mongoose.disconnect();
  }

  console.log('\n--- Result Review & Explanations Verification Results ---');
  let passed = 0;
  for (const t of tests) {
    console.log(t);
    if (t.startsWith('✅')) passed++;
  }
  console.log(`\nSummary: ${passed}/${tests.length} tests passed.`);

  if (passed !== tests.length) {
    process.exit(1);
  }
}

runTests();
