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
  console.log('[Test] Connected to MongoDB for Final Audit Requirements Tests');

  // Ensure admin user has role 'admin'
  await User.findOneAndUpdate({ email: 'admin@example.com' }, { role: 'admin' });

  const tests = [];

  const getToken = async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
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

  const studentToken = await getToken('student@example.com', 'Student@123');
  const teacherToken = await getToken('teacher@example.com', 'Teacher@123');
  const adminToken = await getToken('admin@example.com', 'Admin@123');

  const studentHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${studentToken}`,
  };

  const teacherHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${teacherToken}`,
  };

  const adminHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };

  const studentUser = await User.findOne({ email: 'student@example.com' });
  const teacherUser = await User.findOne({ email: 'teacher@example.com' });
  const adminUser = await User.findOne({ email: 'admin@example.com' });

  // Create temporary test student for role update and deletion tests
  const tempUser = await User.create({
    name: 'Temporary Audit User',
    email: `audit_temp_${Date.now()}@example.com`,
    password: 'Password@123',
    role: 'student',
  });

  // Create test exam and attempts for student
  const now = new Date();
  const testExam = await Exam.create({
    title: 'Final Audit Test Exam',
    duration: 30,
    startTime: new Date(now.getTime() - 3600000),
    endTime: new Date(now.getTime() + 7200000),
    status: 'published',
    createdBy: teacherUser._id,
  });

  const testAttempt = await ExamAttempt.create({
    exam: testExam._id,
    student: studentUser._id,
    startedAt: new Date(now.getTime() - 1800000),
    submittedAt: new Date(now.getTime() - 900000),
    status: 'submitted',
    score: 10,
    totalMarks: 10,
    answers: [],
  });

  try {
    // Test 1: GET /api/attempts/my-attempts requires authentication
    {
      const res = await fetch(`${BASE_URL}/attempts/my-attempts`);
      if (res.status === 401) {
        tests.push('✅ 1. GET /api/attempts/my-attempts rejects unauthenticated requests (401)');
      } else {
        tests.push(`❌ 1. Expected 401, got ${res.status}`);
      }
    }

    // Test 2: Teacher is rejected from /api/attempts/my-attempts (403)
    {
      const res = await fetch(`${BASE_URL}/attempts/my-attempts`, { headers: teacherHeaders });
      if (res.status === 403) {
        tests.push('✅ 2. Teacher is rejected from student /api/attempts/my-attempts (403)');
      } else {
        tests.push(`❌ 2. Expected 403, got ${res.status}`);
      }
    }

    // Test 3: Student can retrieve their own attempts list
    {
      const res = await fetch(`${BASE_URL}/attempts/my-attempts`, { headers: studentHeaders });
      const data = await res.json();
      const hasAttempt = data.attempts?.some((a) => a.attemptId?.toString() === testAttempt._id.toString());
      if (res.status === 200 && data.success && hasAttempt) {
        tests.push('✅ 3. Student can retrieve their own attempts list via GET /api/attempts/my-attempts');
      } else {
        tests.push(`❌ 3. Failed to retrieve student attempts: ${JSON.stringify(data)}`);
      }
    }

    // Test 4: PUT /api/users/profile updates user name
    {
      const originalName = studentUser.name;
      const res = await fetch(`${BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: studentHeaders,
        body: JSON.stringify({ name: 'Updated Student Name' }),
      });
      const data = await res.json();
      const verifiedUser = await User.findById(studentUser._id);

      if (res.status === 200 && verifiedUser.name === 'Updated Student Name') {
        tests.push('✅ 4. Student can update profile via PUT /api/users/profile');
      } else {
        tests.push(`❌ 4. Profile update failed: ${JSON.stringify(data)}`);
      }

      // Revert name back
      await User.findByIdAndUpdate(studentUser._id, { name: originalName });
    }

    // Test 5: GET /api/users rejects unauthenticated requests
    {
      const res = await fetch(`${BASE_URL}/users`);
      if (res.status === 401) {
        tests.push('✅ 5. GET /api/users rejects unauthenticated requests (401)');
      } else {
        tests.push(`❌ 5. Expected 401, got ${res.status}`);
      }
    }

    // Test 6: GET /api/users rejects student role (403)
    {
      const res = await fetch(`${BASE_URL}/users`, { headers: studentHeaders });
      if (res.status === 403) {
        tests.push('✅ 6. Student is rejected from GET /api/users (403)');
      } else {
        tests.push(`❌ 6. Expected 403, got ${res.status}`);
      }
    }

    // Test 7: GET /api/users for teacher returns only students
    {
      const res = await fetch(`${BASE_URL}/users`, { headers: teacherHeaders });
      const data = await res.json();
      const allStudents = data.users?.every((u) => u.role === 'student');
      if (res.status === 200 && data.success && data.users?.length > 0 && allStudents) {
        tests.push('✅ 7. Teacher GET /api/users returns strictly students only');
      } else {
        tests.push(`❌ 7. Teacher GET /api/users returned non-students or failed: ${JSON.stringify(data)}`);
      }
    }

    // Test 8: GET /api/users for admin returns all users
    {
      const res = await fetch(`${BASE_URL}/users`, { headers: adminHeaders });
      const data = await res.json();
      const roles = new Set(data.users?.map((u) => u.role));
      if (res.status === 200 && data.success && roles.has('student') && roles.has('teacher') && roles.has('admin')) {
        tests.push('✅ 8. Admin GET /api/users returns all system roles (student, teacher, admin)');
      } else {
        tests.push(`❌ 8. Admin GET /api/users did not return all roles: ${JSON.stringify(Array.from(roles))}`);
      }
    }

    // Test 9: Admin can update user role via PUT /api/users/:id/role
    {
      const res = await fetch(`${BASE_URL}/users/${tempUser._id}/role`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({ role: 'teacher' }),
      });
      const data = await res.json();
      const updatedUser = await User.findById(tempUser._id);
      if (res.status === 200 && updatedUser.role === 'teacher') {
        tests.push('✅ 9. Admin can update user role via PUT /api/users/:id/role');
      } else {
        tests.push(`❌ 9. Role update failed: ${JSON.stringify(data)}`);
      }
    }

    // Test 10: Teacher cannot update user role (403)
    {
      const res = await fetch(`${BASE_URL}/users/${tempUser._id}/role`, {
        method: 'PUT',
        headers: teacherHeaders,
        body: JSON.stringify({ role: 'admin' }),
      });
      if (res.status === 403) {
        tests.push('✅ 10. Teacher is blocked from updating user roles (403)');
      } else {
        tests.push(`❌ 10. Expected 403, got ${res.status}`);
      }
    }

    // Test 11: Admin cannot modify own role (400)
    {
      const res = await fetch(`${BASE_URL}/users/${adminUser._id}/role`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({ role: 'student' }),
      });
      if (res.status === 400) {
        tests.push('✅ 11. Admin cannot demote self role (400 Bad Request)');
      } else {
        tests.push(`❌ 11. Expected 400, got ${res.status}`);
      }
    }

    // Test 12: Admin can delete user via DELETE /api/users/:id
    {
      const res = await fetch(`${BASE_URL}/users/${tempUser._id}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      const data = await res.json();
      const deletedUser = await User.findById(tempUser._id);
      if (res.status === 200 && !deletedUser) {
        tests.push('✅ 12. Admin can delete user via DELETE /api/users/:id');
      } else {
        tests.push(`❌ 12. Delete user failed: ${JSON.stringify(data)}`);
      }
    }

    // Test 13: Admin cannot delete own account (400)
    {
      const res = await fetch(`${BASE_URL}/users/${adminUser._id}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      if (res.status === 400) {
        tests.push('✅ 13. Admin cannot delete own account (400 Bad Request)');
      } else {
        tests.push(`❌ 13. Expected 400, got ${res.status}`);
      }
    }

    // Test 14: Teacher cannot delete user (403)
    {
      const res = await fetch(`${BASE_URL}/users/${studentUser._id}`, {
        method: 'DELETE',
        headers: teacherHeaders,
      });
      if (res.status === 403) {
        tests.push('✅ 14. Teacher is blocked from deleting user accounts (403)');
      } else {
        tests.push(`❌ 14. Expected 403, got ${res.status}`);
      }
    }
  } finally {
    // Cleanup
    await ExamAttempt.deleteOne({ _id: testAttempt._id });
    await Exam.deleteOne({ _id: testExam._id });
    await User.deleteOne({ _id: tempUser._id });
    await mongoose.disconnect();
    console.log('[Test] Disconnected from MongoDB');
  }

  console.log('\n--- Final Audit Requirements Test Results ---');
  tests.forEach((t) => console.log(t));

  const failed = tests.filter((t) => t.startsWith('❌'));
  if (failed.length > 0) {
    console.error(`\n${failed.length} test(s) failed`);
    process.exit(1);
  } else {
    console.log(`\nAll ${tests.length} tests passed successfully! 🚀`);
  }
};

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
