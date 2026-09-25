import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — redirects unauthenticated users to /login.
 * Optionally restricts by allowed roles.
 *
 * Usage:
 *   <ProtectedRoute>...</ProtectedRoute>
 *   <ProtectedRoute allowedRoles={['teacher','admin']}>...</ProtectedRoute>
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While session is being restored, render nothing
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Restoring session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    // Preserve the intended destination so we can redirect back after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Authenticated but wrong role — redirect to their own dashboard
    const dashboardMap = {
      student: '/student/dashboard',
      teacher: '/teacher/dashboard',
      admin: '/admin/dashboard',
    };
    return <Navigate to={dashboardMap[user.role] || '/'} replace />;
  }

  return children;
};

export default ProtectedRoute;
