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
  console.log('[Test] Connected to MongoDB for Academic Profile Tests');

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

    // ─── 1. Student Academic Profile Tests ──────────────────────────────────────────
    // 1.1 Student can update permitted academic fields
    const sUpdateRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        name: student.name,
        studentId: 'STU-2026-001',
        department: 'Computer Science & Engineering',
        section: 'Section A',
        yearOfStudy: '3rd Year',
        bio: 'Aspiring software engineer',
      }),
    });
    const sUpdateData = await sUpdateRes.json();
    if (
      sUpdateRes.status === 200 &&
      sUpdateData.user.studentId === 'STU-2026-001' &&
      sUpdateData.user.department === 'Computer Science & Engineering' &&
      sUpdateData.user.section === 'Section A' &&
      sUpdateData.user.yearOfStudy === '3rd Year'
    ) {
      tests.push('✅ 1. Student can update academic fields (studentId, department, section, yearOfStudy)');
    } else {
      tests.push('❌ 1. Student academic fields update failed');
    }

    // 1.2 Student accepts rollNumber alias
    const sRollRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        rollNumber: 'ROLL-2026-999',
      }),
    });
    const sRollData = await sRollRes.json();
    if (sRollRes.status === 200 && sRollData.user.studentId === 'ROLL-2026-999' && sRollData.user.rollNumber === 'ROLL-2026-999') {
      tests.push('✅ 2. Student accepts rollNumber alias for studentId');
    } else {
      tests.push('❌ 2. rollNumber alias failed');
    }

    // 1.3 Invalid yearOfStudy is rejected
    const sBadYearRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        yearOfStudy: '5th Year',
      }),
    });
    if (sBadYearRes.status === 400) {
      tests.push('✅ 3. Invalid yearOfStudy rejected (400 Bad Request)');
    } else {
      tests.push('❌ 3. Invalid yearOfStudy was not rejected');
    }

    // 1.4 Student cannot set teacher fields (employeeId, designation)
    const sTeacherHackRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        employeeId: 'HACKED-EMP-001',
        designation: 'Professor',
      }),
    });
    const sTeacherHackData = await sTeacherHackRes.json();
    if (sTeacherHackRes.status === 200 && !sTeacherHackData.user.employeeId && !sTeacherHackData.user.designation) {
      tests.push('✅ 4. Student cannot set teacher-specific fields (employeeId, designation)');
    } else {
      tests.push('❌ 4. Student managed to set teacher-specific fields');
    }

    // 1.5 Student cannot change own role or email
    const sRoleHackRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        role: 'admin',
        email: 'hacked_student@example.com',
      }),
    });
    const sRoleHackData = await sRoleHackRes.json();
    if (sRoleHackRes.status === 200 && sRoleHackData.user.role === 'student' && sRoleHackData.user.email === student.email) {
      tests.push('✅ 5. Student cannot change role or email through profile update');
    } else {
      tests.push('❌ 5. Student modified immutable role or email');
    }

    // ─── 2. Teacher Faculty Profile Tests ──────────────────────────────────────────
    // 2.1 Teacher can update permitted faculty fields
    const tUpdateRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        name: teacher.name,
        employeeId: 'FAC-2024-042',
        department: 'Information Technology',
        designation: 'Associate Professor',
        bio: 'Researching distributed systems and cloud architecture',
      }),
    });
    const tUpdateData = await tUpdateRes.json();
    if (
      tUpdateRes.status === 200 &&
      tUpdateData.user.employeeId === 'FAC-2024-042' &&
      tUpdateData.user.department === 'Information Technology' &&
      tUpdateData.user.designation === 'Associate Professor'
    ) {
      tests.push('✅ 6. Teacher can update faculty fields (employeeId, department, designation)');
    } else {
      tests.push('❌ 6. Teacher faculty fields update failed');
    }

    // 2.2 Teacher accepts facultyId alias
    const tFacRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        facultyId: 'FAC-ALIAS-777',
      }),
    });
    const tFacData = await tFacRes.json();
    if (tFacRes.status === 200 && tFacData.user.employeeId === 'FAC-ALIAS-777' && tFacData.user.facultyId === 'FAC-ALIAS-777') {
      tests.push('✅ 7. Teacher accepts facultyId alias for employeeId');
    } else {
      tests.push('❌ 7. facultyId alias failed');
    }

    // 2.3 Invalid designation is rejected
    const tBadDesigRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        designation: 'Dean Emeritus',
      }),
    });
    if (tBadDesigRes.status === 400) {
      tests.push('✅ 8. Invalid designation rejected (400 Bad Request)');
    } else {
      tests.push('❌ 8. Invalid designation was not rejected');
    }

    // 2.4 Teacher cannot set student fields (studentId, section, yearOfStudy)
    const tStudentHackRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        studentId: 'STU-HACK-001',
        section: 'Sec B',
        yearOfStudy: '1st Year',
      }),
    });
    const tStudentHackData = await tStudentHackRes.json();
    if (tStudentHackRes.status === 200 && !tStudentHackData.user.studentId && !tStudentHackData.user.section && !tStudentHackData.user.yearOfStudy) {
      tests.push('✅ 9. Teacher cannot set student-specific fields (studentId, section, yearOfStudy)');
    } else {
      tests.push('❌ 9. Teacher managed to set student-specific fields');
    }

    // 2.5 Teacher cannot change own role or email
    const tRoleHackRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        role: 'admin',
        email: 'hacked_teacher@example.com',
      }),
    });
    const tRoleHackData = await tRoleHackRes.json();
    if (tRoleHackRes.status === 200 && tRoleHackData.user.role === 'teacher' && tRoleHackData.user.email === teacher.email) {
      tests.push('✅ 10. Teacher cannot change role or email through profile update');
    } else {
      tests.push('❌ 10. Teacher modified immutable role or email');
    }

    // ─── 3. Admin Profile & User Management Tests ──────────────────────────────────
    // 3.1 Admin updates general profile fields
    const aUpdateRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: admin.name,
        phone: '123-456-7890',
        bio: 'Platform Chief Administrator',
      }),
    });
    const aUpdateData = await aUpdateRes.json();
    if (aUpdateRes.status === 200 && aUpdateData.user.bio === 'Platform Chief Administrator') {
      tests.push('✅ 11. Admin can update standard profile fields');
    } else {
      tests.push('❌ 11. Admin profile update failed');
    }

    // 3.2 Admin cannot update role via profile update
    const aRoleHackRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        role: 'student',
      }),
    });
    const aRoleHackData = await aRoleHackRes.json();
    if (aRoleHackRes.status === 200 && aRoleHackData.user.role === 'admin') {
      tests.push('✅ 12. Admin cannot change own role via profile update');
    } else {
      tests.push('❌ 12. Admin modified role via profile update');
    }

    // 3.3 Persistence check: /api/auth/me returns persisted academic and faculty data
    const sMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const sMeData = await sMeRes.json();
    if (sMeRes.status === 200 && sMeData.user.department === 'Computer Science & Engineering' && sMeData.user.yearOfStudy === '3rd Year') {
      tests.push('✅ 13. Student academic fields persist across session reload (/api/auth/me)');
    } else {
      tests.push('❌ 13. Student academic fields did not persist');
    }

    const tMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const tMeData = await tMeRes.json();
    if (tMeRes.status === 200 && tMeData.user.department === 'Information Technology' && tMeData.user.designation === 'Associate Professor') {
      tests.push('✅ 14. Teacher faculty fields persist across session reload (/api/auth/me)');
    } else {
      tests.push('❌ 14. Teacher faculty fields did not persist');
    }

    // 3.4 Admin User Management still works on other users
    const aUserMgmtRes = await fetch(`${BASE_URL}/users/${student._id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ role: 'student' }),
    });
    if (aUserMgmtRes.status === 200) {
      tests.push('✅ 15. Admin User Management endpoint operates normally on other users (200 OK)');
    } else {
      tests.push('❌ 15. Admin User Management failed on other user');
    }

    // 3.5 Admin cannot demote self via User Management
    const aSelfDemoteRes = await fetch(`${BASE_URL}/users/${admin._id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ role: 'student' }),
    });
    if (aSelfDemoteRes.status === 400) {
      tests.push('✅ 16. Admin self-demotion protection enforced via User Management (400 Bad Request)');
    } else {
      tests.push('❌ 16. Admin self-demotion protection failed');
    }

    console.log('\n--- Academic Profile Test Results ---');
    tests.forEach((t) => console.log(t));

    const failed = tests.filter((t) => t.startsWith('❌'));
    if (failed.length > 0) {
      console.error(`\n${failed.length} test(s) failed!`);
      process.exit(1);
    } else {
      console.log(`\nAll ${tests.length} academic profile tests passed successfully! 🚀`);
    }
  } finally {
    await mongoose.disconnect();
    console.log('[Test] Disconnected from MongoDB');
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
