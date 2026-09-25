import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import GuestRoute from './routes/GuestRoute';

// Public Landing Page
import Home from './pages/Home';

// Authentication Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard Pages
import StudentDashboard from './pages/student/Dashboard';
import TeacherDashboard from './pages/teacher/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

// Examination Management Pages (Teacher & Admin)
import ExamList from './pages/exams/ExamList';
import ExamCreate from './pages/exams/ExamCreate';
import ExamDetail from './pages/exams/ExamDetail';
import ExamEdit from './pages/exams/ExamEdit';

// Student Examination Pages (Phase 4D & 6A)
import StudentExamList from './pages/student/StudentExamList';
import ExamTaking from './pages/student/ExamTaking';
import ExamSubmitted from './pages/student/ExamSubmitted';
import ExamResult from './pages/student/ExamResult';

// Reporting Pages (Phase 6B)
import TeacherReports from './pages/teacher/TeacherReports';
import AdminReports from './pages/admin/AdminReports';
import ExamReport from './pages/reports/ExamReport';

// Requirement 1, 8C, 8D Management & Result Pages
import Profile from './pages/Profile';
import StudentResults from './pages/student/StudentResults';
import StudentList from './pages/teacher/StudentList';
import StudentDetails from './pages/teacher/StudentDetails';
import TeacherResults from './pages/teacher/TeacherResults';
import UserManagement from './pages/admin/UserManagement';
import AdminResults from './pages/admin/AdminResults';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          {/* Public Home / Landing Route (Redirects authenticated users to role dashboard) */}
          <Route
            path="/"
            element={
              <GuestRoute>
                <Home />
              </GuestRoute>
            }
          />

          {/* Guest-only routes */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />

          {/* Student routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exams"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentExamList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exams/:attemptId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamTaking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exams/:attemptId/submitted"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamSubmitted />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exams/:attemptId/result"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamResult />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/results"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentResults />
              </ProtectedRoute>
            }
          />

          {/* Teacher routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/exams"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <ExamList basePath="/teacher/exams" isAdmin={false} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/exams/create"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <ExamCreate basePath="/teacher/exams" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/exams/:id"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <ExamDetail basePath="/teacher/exams" isAdmin={false} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/exams/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <ExamEdit basePath="/teacher/exams" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/exams/:id/report"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <ExamReport basePath="/teacher/exams" isAdmin={false} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/reports"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/students"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <StudentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/students/:studentId"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <StudentDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/results"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/profile"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ExamList basePath="/admin/exams" isAdmin={true} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams/create"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ExamCreate basePath="/admin/exams" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ExamDetail basePath="/admin/exams" isAdmin={true} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ExamEdit basePath="/admin/exams" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams/:id/report"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ExamReport basePath="/admin/exams" isAdmin={true} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/results"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
  );
}

export default App;
