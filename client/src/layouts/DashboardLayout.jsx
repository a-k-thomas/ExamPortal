import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import ThemeToggle from '../components/common/ThemeToggle';
import {
  GraduationCap,
  LogOut,
  User,
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BarChart2,
  Users,
  Menu,
  X,
} from 'lucide-react';

const roleConfig = {
  student: {
    label: 'Student',
    navItems: [
      { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/student/exams', icon: BookOpen, label: 'Available Exams' },
      { to: '/student/results', icon: ClipboardList, label: 'My Results' },
      { to: '/student/profile', icon: User, label: 'My Profile' },
    ],
  },
  teacher: {
    label: 'Teacher',
    navItems: [
      { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/teacher/exams', icon: BookOpen, label: 'Manage Exams' },
      { to: '/teacher/students', icon: Users, label: 'Enrolled Students' },
      { to: '/teacher/results', icon: ClipboardList, label: 'Exam Results' },
      { to: '/teacher/reports', icon: BarChart2, label: 'Analytics Reports' },
      { to: '/teacher/profile', icon: User, label: 'My Profile' },
    ],
  },
  admin: {
    label: 'Administrator',
    navItems: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/exams', icon: BookOpen, label: 'All Exams' },
      { to: '/admin/students', icon: Users, label: 'User Directory' },
      { to: '/admin/results', icon: ClipboardList, label: 'Institution Results' },
      { to: '/admin/reports', icon: BarChart2, label: 'System Analytics' },
      { to: '/admin/profile', icon: User, label: 'My Profile' },
    ],
  },
};

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const config = roleConfig[user?.role] || roleConfig.student;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-stone-200 dark:border-emerald-950/80 bg-white dark:bg-[#0c1813] shrink-0">
        <Link to={`/${user?.role || 'student'}/dashboard`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-white flex items-center justify-center shadow-md shadow-emerald-900/10 group-hover:scale-105 transition-transform duration-200 border border-emerald-500/20">
            <GraduationCap className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-stone-900 dark:text-stone-100 text-base tracking-tight">
                Exam<span className="text-emerald-600 dark:text-emerald-400">Portal</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-300" />
            </div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-stone-400 dark:text-emerald-400/80">
              Academic Assessment
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation (begins immediately after application branding) */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
          Main Navigation
        </p>
        {config.navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                ${isActive
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold border-l-[3px] border-emerald-600 dark:border-emerald-400 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-emerald-950/30'
                }`}
            >
              <Icon
                className={`w-4.5 h-4.5 shrink-0 ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-stone-400 dark:text-stone-500'
                }`}
              />
              <span className="flex-1 truncate">{label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out (anchored at the bottom) */}
      <div className="p-3 border-t border-stone-200 dark:border-emerald-950/80 bg-stone-50/50 dark:bg-[#0c1813] shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          className="group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          <LogOut className="w-4.5 h-4.5 shrink-0 text-stone-400 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#09120e] text-stone-900 dark:text-stone-100 flex transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-[#0c1813] border-r border-stone-200 dark:border-emerald-950/80 flex-col shrink-0 fixed inset-y-0 left-0 z-30 shadow-xs">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-Out Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#0c1813] border-r border-stone-200 dark:border-emerald-950/80 z-50 lg:hidden transform transition-transform duration-200 ease-in-out shadow-xl ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64">
        {/* Sticky Header Topbar */}
        <header className="h-16 bg-white/80 dark:bg-[#0c1813]/85 backdrop-blur-md border-b border-stone-200 dark:border-emerald-950/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-emerald-950/40 rounded-lg cursor-pointer"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <span className="font-semibold text-stone-700 dark:text-stone-300">ExamPortal</span>
              <span>/</span>
              <span className="capitalize text-emerald-700 dark:text-emerald-400 font-medium">
                {user?.role} Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle showLabel size="sm" />
            <div className="h-5 w-px bg-stone-200 dark:bg-emerald-950" />
            <Link
              to={`/${user?.role || 'student'}/profile`}
              className="flex items-center gap-2.5 group hover:opacity-95 transition-opacity"
              title="Manage Account Profile"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-amber-200 text-xs font-bold flex items-center justify-center border border-amber-300/30 shadow-2xs group-hover:scale-105 transition-transform">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {user?.name}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {config.label}
                </p>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
