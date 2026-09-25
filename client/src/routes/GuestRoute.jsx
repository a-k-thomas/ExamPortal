import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * GuestRoute — redirects already-authenticated users away from /login and /register
 * to their role-appropriate dashboard.
 */
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    const dashboardMap = {
      student: '/student/dashboard',
      teacher: '/teacher/dashboard',
      admin: '/admin/dashboard',
    };
    return <Navigate to={dashboardMap[user.role] || '/'} replace />;
  }

  return children;
};

export default GuestRoute;
