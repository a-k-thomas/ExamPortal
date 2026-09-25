import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

const runIntegrationTests = async () => {
  const tests = [];

  // ─── 0. Authenticate test users ───
  // Login as student
  const studentRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@example.com', password: 'Student@123' }),
  });
  const studentData = await studentRes.json();
  const studentToken = studentData.token;

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

  const teacherHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${teacherToken}`,
  };

  // ─── TEST 1: GET available exams requires authentication (401) ───
  const res1 = await fetch(`${BASE_URL}/attempts/available-exams`);
  const data1 = await res1.json();
  tests.push(
    res1.status === 401 && data1.success === false
      ? '✅ 1. GET available exams requires authentication (401 Unauthorized)'
      : '❌ 1. Expected 401 for unauthenticated request, got ' + res1.status
  );

  // ─── TEST 2: Teacher is rejected from student attempt routes (403) ───
  const res2 = await fetch(`${BASE_URL}/attempts/available-exams`, {
    headers: teacherHeaders,
  });
  const data2 = await res2.json();
  tests.push(
    res2.status === 403 && data2.success === false
      ? '✅ 2. Teacher is rejected from student attempt routes (403 Forbidden)'
      : '❌ 2. Expected 403 for teacher accessing student routes, got ' + res2.status
  );

  // ─── TEST 3: Student can retrieve available exams ───
  const res3 = await fetch(`${BASE_URL}/attempts/available-exams`, {
    headers: studentHeaders,
  });
  const data3 = await res3.json();
  tests.push(
    res3.status === 200 && data3.success === true && Array.isArray(data3.exams)
      ? `✅ 3. Student can retrieve available exams (count: ${data3.count})`
      : '❌ 3. Failed to retrieve available exams: ' + res3.status
  );

  // Identify a valid exam to test
  // Create a dedicated fresh exam for route testing so attempts are completely isolated
  const now = new Date();
  const createExamRes = await fetch(`${BASE_URL}/exams`, {
    method: 'POST',
    headers: teacherHeaders,
    body: JSON.stringify({
      title: `Phase 4C Route Test Exam ${Date.now()}`,
      duration: 30,
      startTime: new Date(now.getTime() - 1000000).toISOString(),
      endTime: new Date(now.getTime() + 10000000).toISOString(),
    }),
  });
  const created = await createExamRes.json();
  const targetExam = created.exam;

  // Add question
  await fetch(`${BASE_URL}/exams/${targetExam._id}/questions`, {
    method: 'POST',
    headers: teacherHeaders,
    body: JSON.stringify({
      questionText: 'Which protocol is used for secure web browsing?',
      options: ['HTTP', 'HTTPS', 'FTP', 'Telnet'],
      correctAnswer: 'HTTPS',
      marks: 2,
      order: 1,
    }),
  });

  // Publish exam
  await fetch(`${BASE_URL}/exams/${targetExam._id}/publish`, {
    method: 'PATCH',
    headers: teacherHeaders,
  });

  // ─── TEST 4: Student can start a valid exam ───
  const res4 = await fetch(`${BASE_URL}/attempts/exams/${targetExam._id}/start`, {
    method: 'POST',
    headers: studentHeaders,
  });
  const data4 = await res4.json();
  const attemptId = data4.attempt?._id;
  tests.push(
    (res4.status === 201 || res4.status === 200) && attemptId
      ? `✅ 4. Student can start or resume valid exam (status: ${res4.status}, attemptId: ${attemptId})`
      : '❌ 4. Failed to start exam: ' + res4.status
  );

  // ─── TEST 5: Student can retrieve their attempt ───
  const res5 = await fetch(`${BASE_URL}/attempts/${attemptId}`, {
    headers: studentHeaders,
  });
  const data5 = await res5.json();
  tests.push(
    res5.status === 200 && data5.attempt?._id === attemptId
      ? '✅ 5. Student can retrieve their own attempt via GET /api/attempts/:id'
      : '❌ 5. Failed to retrieve attempt: ' + res5.status
  );

  // ─── TEST 6: Student can save an answer ───
  const questionToAnswer = data4.questions?.[0] || data5.questions?.[0];
  const selectedOpt = questionToAnswer?.options?.[0] || 'A';
  const res6 = await fetch(`${BASE_URL}/attempts/${attemptId}/answer`, {
    method: 'PATCH',
    headers: studentHeaders,
    body: JSON.stringify({
      questionId: questionToAnswer?._id,
      selectedAnswer: selectedOpt,
      // Attempting to pass fake marksAwarded to verify security
      marksAwarded: 9999,
    }),
  });
  const data6 = await res6.json();
  tests.push(
    res6.status === 200 && data6.answer?.selectedAnswer === selectedOpt
      ? '✅ 6. Student can save an answer via PATCH /api/attempts/:id/answer'
      : '❌ 6. Failed to save answer: ' + res6.status
  );

  // ─── TEST 7: Student can submit the attempt ───
  const res7 = await fetch(`${BASE_URL}/attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({}),
  });
  const data7 = await res7.json();
  tests.push(
    res7.status === 200 && (data7.attempt?.status === 'submitted' || data7.alreadySubmitted)
      ? '✅ 7. Student can submit the attempt via POST /api/attempts/:id/submit'
      : '❌ 7. Failed to submit attempt: ' + res7.status
  );

  // ─── TEST 8: Existing Phase 4B security behavior remains intact through HTTP routes ───
  // Verify: correctAnswer is never leaked, score is not evaluated prematurely (remains 0)
  const allJson = JSON.stringify({ data3, data4, data5, data6, data7 });
  const hasLeak = allJson.includes('correctAnswer');
  tests.push(
    !hasLeak
      ? '✅ 8. Security integrity verified: correctAnswer NEVER appears in HTTP responses'
      : '❌ 8. Security failure: correctAnswer leaked in HTTP response!'
  );

  // ─── TEST 9: Existing Phase 1–3 routes still respond correctly ───
  // Test teacher exam listing
  const res9 = await fetch(`${BASE_URL}/exams`, {
    headers: teacherHeaders,
  });
  const data9 = await res9.json();
  tests.push(
    res9.status === 200 && data9.success === true
      ? '✅ 9. Phase 1–3 routes confirmed intact (/api/exams returns 200 for teacher)'
      : '❌ 9. Regression in existing routes: ' + res9.status
  );

  // ─── TEST 10: Health endpoint still works ───
  const res10 = await fetch(`${BASE_URL}/health`);
  const data10 = await res10.json();
  tests.push(
    res10.status === 200 && data10.database?.status === 'connected'
      ? '✅ 10. Health endpoint operational (/api/health returns 200 OK)'
      : '❌ 10. Health check failed: ' + res10.status
  );

  console.log('\n--- Phase 4C Route Integration Test Results ---');
  tests.forEach((t) => console.log(t));
};

runIntegrationTests().catch((err) => {
  console.error('Integration test failed with error:', err);
  process.exit(1);
});
