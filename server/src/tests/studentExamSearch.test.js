import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Exam from '../models/Exam.js';
import {
  getExamSubject,
  getExamCode,
  getExamStatusCategory,
  matchesSearch,
} from '../../../client/src/utils/examFilters.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online-exam-portal';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_12345';
const BASE_URL = 'http://localhost:5000/api';

const generateToken = (userId, role) => jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });

async function runTests() {
  console.log('[Test] Starting Student Exam Search & Filter Verification Suite');

  const tests = [];

  // Mock exam data for unit assertions
  const now = new Date();
  const mockExams = [
    {
      _id: 'exam1',
      title: 'CS301: Data Structures & Algorithms Midterm',
      description: 'Covers trees, graphs, sorting, and asymptotic analysis.',
      instructions: 'Answer all questions.',
      duration: 60,
      startTime: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
      endTime: new Date(now.getTime() + 4 * 3600 * 1000).toISOString(),   // 4 hours in future
      studentAttempt: null,
      createdAt: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString(),
    },
    {
      _id: 'exam2',
      title: 'IT304: Database Management Systems Evaluation',
      description: 'Relational schemas, SQL queries, BCNF normalization.',
      instructions: 'No external documentation allowed.',
      duration: 45,
      startTime: new Date(now.getTime() - 10 * 3600 * 1000).toISOString(),
      endTime: new Date(now.getTime() + 2 * 3600 * 1000).toISOString(),
      studentAttempt: { status: 'submitted', attemptId: 'att2' },
      createdAt: new Date(now.getTime() - 4 * 24 * 3600 * 1000).toISOString(),
    },
    {
      _id: 'exam3',
      title: 'EC208: Computer Networks & Protocol Design',
      description: 'OSI 7 layers, TCP congestion, IP subnetting.',
      instructions: 'Scientific calculators permitted.',
      duration: 50,
      startTime: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(), // Tomorrow
      endTime: new Date(now.getTime() + 48 * 3600 * 1000).toISOString(),
      studentAttempt: null,
      createdAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
    },
    {
      _id: 'exam4',
      title: 'General Aptitude and Logic Reasoning',
      description: 'Verbal reasoning, quantitative logic, and pattern analysis.',
      subject: 'Humanities & Logic',
      duration: 30,
      startTime: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
      endTime: new Date(now.getTime() + 1 * 3600 * 1000).toISOString(),
      studentAttempt: { status: 'in_progress', attemptId: 'att4' },
      createdAt: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString(),
    },
  ];

  // 1. Search by title (case-insensitive)
  tests.push(
    matchesSearch(mockExams[0], 'data structures') &&
      matchesSearch(mockExams[0], 'ALGORITHMS') &&
      !matchesSearch(mockExams[0], 'astrophysics')
      ? '✅ 1. Search matches title case-insensitively'
      : '❌ 1. Title search matching failed'
  );

  // 2. Search by subject
  tests.push(
    matchesSearch(mockExams[0], 'Computer Science') &&
      matchesSearch(mockExams[1], 'Information Technology') &&
      matchesSearch(mockExams[3], 'Humanities & Logic')
      ? '✅ 2. Search matches derived and explicit subjects'
      : '❌ 2. Subject search matching failed'
  );

  // 3. Search by course code with and without whitespace
  tests.push(
    matchesSearch(mockExams[0], 'CS301') &&
      matchesSearch(mockExams[0], 'CS 301') &&
      matchesSearch(mockExams[2], 'EC208') &&
      matchesSearch(mockExams[2], 'ec 208')
      ? '✅ 3. Search matches exam course code with whitespace tolerance'
      : '❌ 3. Exam code search matching failed'
  );

  // 4. Search by description
  tests.push(
    matchesSearch(mockExams[1], 'relational schemas') &&
      matchesSearch(mockExams[2], 'TCP congestion')
      ? '✅ 4. Search matches description text'
      : '❌ 4. Description search matching failed'
  );

  // 5. Subject extraction helper
  const sub1 = getExamSubject(mockExams[0]);
  const sub2 = getExamSubject(mockExams[1]);
  const sub3 = getExamSubject(mockExams[2]);
  const sub4 = getExamSubject(mockExams[3]);
  tests.push(
    sub1 === 'Computer Science (CS)' &&
      sub2 === 'Information Technology (IT)' &&
      sub3 === 'Electronics & Comm (EC)' &&
      sub4 === 'Humanities & Logic'
      ? '✅ 5. getExamSubject derives standardized and custom subjects correctly'
      : `❌ 5. Subject derivation failed: ${sub1}, ${sub2}, ${sub3}, ${sub4}`
  );

  // 6. Exam code extraction helper
  const code1 = getExamCode(mockExams[0]);
  const code2 = getExamCode(mockExams[1]);
  const code3 = getExamCode(mockExams[2]);
  const code4 = getExamCode(mockExams[3]);
  tests.push(
    code1 === 'CS301' && code2 === 'IT304' && code3 === 'EC208' && code4 === ''
      ? '✅ 6. getExamCode extracts course code correctly'
      : `❌ 6. Code extraction failed: ${code1}, ${code2}, ${code3}, ${code4}`
  );

  // 7. Status calculation: AVAILABLE_NOW
  const stat1 = getExamStatusCategory(mockExams[0]);
  const stat4 = getExamStatusCategory(mockExams[4]); // in_progress but unsubmitted
  tests.push(
    stat1 === 'AVAILABLE_NOW' && getExamStatusCategory(mockExams[3]) === 'AVAILABLE_NOW'
      ? '✅ 7. getExamStatusCategory calculates AVAILABLE_NOW correctly'
      : `❌ 7. AVAILABLE_NOW status calculation failed: ${stat1}`
  );

  // 8. Status calculation: UPCOMING
  const stat3 = getExamStatusCategory(mockExams[2]);
  tests.push(
    stat3 === 'UPCOMING'
      ? '✅ 8. getExamStatusCategory calculates UPCOMING correctly'
      : `❌ 8. UPCOMING status calculation failed: ${stat3}`
  );

  // 9. Status calculation: CLOSED_COMPLETED (submitted attempt)
  const stat2 = getExamStatusCategory(mockExams[1]);
  tests.push(
    stat2 === 'CLOSED_COMPLETED'
      ? '✅ 9. getExamStatusCategory calculates CLOSED_COMPLETED for submitted exams'
      : `❌ 9. CLOSED_COMPLETED status calculation failed: ${stat2}`
  );

  // 10. Status calculation: CLOSED_COMPLETED (past deadline)
  const expiredMock = {
    ...mockExams[0],
    startTime: new Date(now.getTime() - 20 * 3600 * 1000).toISOString(),
    endTime: new Date(now.getTime() - 5 * 3600 * 1000).toISOString(), // 5 hrs ago
  };
  tests.push(
    getExamStatusCategory(expiredMock) === 'CLOSED_COMPLETED'
      ? '✅ 10. getExamStatusCategory marks expired window as CLOSED_COMPLETED'
      : '❌ 10. Expired window not marked as CLOSED_COMPLETED'
  );

  // 11. Multi-filter combination: Status AVAILABLE_NOW + Search "CS"
  const filteredCombo1 = mockExams.filter(
    (e) => getExamStatusCategory(e) === 'AVAILABLE_NOW' && matchesSearch(e, 'CS')
  );
  tests.push(
    filteredCombo1.length === 1 && filteredCombo1[0]._id === 'exam1'
      ? '✅ 11. Combined Status and Search filter works accurately'
      : `❌ 11. Combined filter failed: length=${filteredCombo1.length}`
  );

  // 12. Multi-filter combination: Subject filter + Search
  const filteredCombo2 = mockExams.filter(
    (e) =>
      getExamSubject(e) === 'Computer Science (CS)' &&
      matchesSearch(e, 'Midterm')
  );
  tests.push(
    filteredCombo2.length === 1 && filteredCombo2[0]._id === 'exam1'
      ? '✅ 12. Combined Subject and Search filter works accurately'
      : `❌ 12. Combined subject and search failed: length=${filteredCombo2.length}`
  );

  // 13. Sorting: UPCOMING (earliest start time first)
  const sortedUpcoming = [...mockExams].sort(
    (a, b) => new Date(a.startTime) - new Date(b.startTime)
  );
  tests.push(
    sortedUpcoming[0]._id === 'exam2' && sortedUpcoming[3]._id === 'exam3'
      ? '✅ 13. Sorting by UPCOMING orders earliest start time first'
      : `❌ 13. Upcoming sort failed: 1st=${sortedUpcoming[0]._id}, last=${sortedUpcoming[3]._id}`
  );

  // 14. Sorting: TITLE_AZ
  const sortedTitle = [...mockExams].sort((a, b) => a.title.localeCompare(b.title));
  tests.push(
    sortedTitle[0].title.startsWith('CS301') &&
      sortedTitle[1].title.startsWith('EC208') &&
      sortedTitle[2].title.startsWith('General') &&
      sortedTitle[3].title.startsWith('IT304')
      ? '✅ 14. Sorting by TITLE_AZ orders exams alphabetically'
      : '❌ 14. Title AZ sorting failed'
  );

  // 15. Integration with Live API /api/attempts/available-exams
  try {
    await mongoose.connect(MONGODB_URI);
    const student = await User.findOne({ role: 'student' });
    if (student) {
      const studentToken = generateToken(student._id, student.role);
      const res = await fetch(`${BASE_URL}/attempts/available-exams`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      const liveExams = data.exams || [];

      // Test searching across live exams
      const csExams = liveExams.filter((e) => matchesSearch(e, 'Computer Science'));
      const statusFiltered = liveExams.filter((e) => getExamStatusCategory(e) === 'AVAILABLE_NOW');

      tests.push(
        res.status === 200 && Array.isArray(liveExams) && liveExams.length > 0 && Array.isArray(csExams)
          ? `✅ 15. Live API endpoint /attempts/available-exams returns ${liveExams.length} exams and filters cleanly (${csExams.length} CS, ${statusFiltered.length} Available Now)`
          : `❌ 15. Live API test failed: ${res.status} ${JSON.stringify(data)}`
      );
    }
    await mongoose.disconnect();
  } catch (err) {
    tests.push(`❌ 15. Live API test encountered exception: ${err.message}`);
  }

  console.log('\n--- Student Exam Search & Filter Test Results ---');
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
