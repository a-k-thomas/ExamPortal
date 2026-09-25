import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online-exam-portal';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_12345';
const BASE_URL = 'http://localhost:5000/api';

const generateToken = (userId, role) => jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });

async function runTests() {
  await mongoose.connect(MONGODB_URI);
  console.log('[Test] Connected to MongoDB for Teacher Student View Tests');

  const tests = [];

  try {
    const student = await User.findOne({ role: 'student' });
    const teacher = await User.findOne({ role: 'teacher' });
    const admin = await User.findOne({ role: 'admin' });

    // Also find or create a second teacher for IDOR testing
    let teacher2 = await User.findOne({ role: 'teacher', _id: { $ne: teacher._id } });
    if (!teacher2) {
      teacher2 = await User.create({
        name: 'Second Teacher',
        email: 'teacher2.test@examportal.internal',
        password: 'Password123!',
        role: 'teacher',
        designation: 'Associate Professor',
        department: 'Information Technology'
      });
    }

    if (!student || !teacher || !admin) {
      throw new Error('Required seed users not found');
    }

    // Ensure student has academic fields set for verification
    student.studentId = 'STU-TEST-999';
    student.department = 'Computer Science & Engineering';
    student.section = 'Section A';
    student.yearOfStudy = '3rd Year';
    student.bio = 'Test student bio for teacher review';
    await student.save();

    const studentToken = generateToken(student._id, student.role);
    const teacherToken = generateToken(teacher._id, teacher.role);
    const adminToken = generateToken(admin._id, admin.role);

    // ─── 1. Teacher can view student profile ──────────────────────────────────────
    const teacherViewStudentRes = await fetch(`${BASE_URL}/users/${student._id}`, {
      headers: {
        Authorization: `Bearer ${teacherToken}`,
      },
    });
    const teacherViewStudentData = await teacherViewStudentRes.json();

    if (
      teacherViewStudentRes.status === 200 &&
      teacherViewStudentData.user &&
      teacherViewStudentData.user.name === student.name &&
      teacherViewStudentData.user.email === student.email &&
      teacherViewStudentData.user.studentId === 'STU-TEST-999' &&
      teacherViewStudentData.user.department === 'Computer Science & Engineering' &&
      teacherViewStudentData.user.section === 'Section A' &&
      teacherViewStudentData.user.yearOfStudy === '3rd Year'
    ) {
      tests.push('✅ 1. Teacher can retrieve student profile with full academic fields (GET /api/users/:id)');
    } else {
      tests.push(`❌ 1. Teacher failed to retrieve student profile: ${JSON.stringify(teacherViewStudentData)}`);
    }

    // ─── 2. Sensitive fields not exposed ──────────────────────────────────────────
    const u = teacherViewStudentData.user;
    if (u && !u.password && !u.passwordHash && !u.resetPasswordToken && !u.verificationToken) {
      tests.push('✅ 2. Sensitive security fields (password, hashes, tokens) are omitted');
    } else {
      tests.push('❌ 2. Sensitive fields leaked in user response');
    }

    // ─── 3. Teacher CANNOT view another teacher (IDOR prevention) ─────────────────
    const teacherViewTeacherRes = await fetch(`${BASE_URL}/users/${teacher2._id}`, {
      headers: {
        Authorization: `Bearer ${teacherToken}`,
      },
    });
    const teacherViewTeacherData = await teacherViewTeacherRes.json();

    if (teacherViewTeacherRes.status === 403) {
      tests.push('✅ 3. Teacher is blocked from retrieving another teacher (403 Forbidden)');
    } else {
      tests.push(`❌ 3. Teacher was not forbidden from retrieving another teacher (Status: ${teacherViewTeacherRes.status})`);
    }

    // ─── 4. Teacher CANNOT view an admin (IDOR prevention) ────────────────────────
    const teacherViewAdminRes = await fetch(`${BASE_URL}/users/${admin._id}`, {
      headers: {
        Authorization: `Bearer ${teacherToken}`,
      },
    });
    const teacherViewAdminData = await teacherViewAdminRes.json();

    if (teacherViewAdminRes.status === 403) {
      tests.push('✅ 4. Teacher is blocked from retrieving an admin (403 Forbidden)');
    } else {
      tests.push(`❌ 4. Teacher was not forbidden from retrieving an admin (Status: ${teacherViewAdminRes.status})`);
    }

    // ─── 5. Student CANNOT view users via GET /api/users/:id ──────────────────────
    const studentViewRes = await fetch(`${BASE_URL}/users/${student._id}`, {
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
    });
    if (studentViewRes.status === 403) {
      tests.push('✅ 5. Student is blocked from calling GET /api/users/:id (403 Forbidden)');
    } else {
      tests.push(`❌ 5. Student was not forbidden from calling GET /api/users/:id (Status: ${studentViewRes.status})`);
    }

    // ─── 6. Unauthenticated request returns 401 ───────────────────────────────────
    const unauthRes = await fetch(`${BASE_URL}/users/${student._id}`);
    if (unauthRes.status === 401) {
      tests.push('✅ 6. Unauthenticated request rejected (401 Unauthorized)');
    } else {
      tests.push(`❌ 6. Unauthenticated request did not return 401 (Status: ${unauthRes.status})`);
    }

    // ─── 7. Non-existent user returns 404 ─────────────────────────────────────────
    const fakeId = new mongoose.Types.ObjectId();
    const notFoundRes = await fetch(`${BASE_URL}/users/${fakeId}`, {
      headers: {
        Authorization: `Bearer ${teacherToken}`,
      },
    });
    if (notFoundRes.status === 404) {
      tests.push('✅ 7. Non-existent user ID returns 404 Not Found');
    } else {
      tests.push(`❌ 7. Non-existent user did not return 404 (Status: ${notFoundRes.status})`);
    }

    // ─── 8. Admin retains access to all roles ─────────────────────────────────────
    const adminViewTeacherRes = await fetch(`${BASE_URL}/users/${teacher._id}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    if (adminViewTeacherRes.status === 200) {
      tests.push('✅ 8. Admin retains unrestricted ability to view any user (200 OK)');
    } else {
      tests.push(`❌ 8. Admin failed to view user (Status: ${adminViewTeacherRes.status})`);
    }

    console.log('\n==================================================');
    console.log(' TEACHER STUDENT VIEW & RBAC VERIFICATION RESULTS');
    console.log('==================================================');
    tests.forEach((t) => console.log(t));

    const failed = tests.filter((t) => t.startsWith('❌'));
    if (failed.length > 0) {
      console.error(`\n${failed.length} test(s) failed!`);
      process.exit(1);
    } else {
      console.log(`\nAll ${tests.length} tests passed successfully! 🚀`);
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
