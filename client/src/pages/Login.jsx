import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle, LogIn, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const dashboardMap = {
    student: '/student/dashboard',
    teacher: '/teacher/dashboard',
    admin: '/admin/dashboard',
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      return setError('Please enter your email and password.');
    }
    setLoading(true);
    setError('');
    try {
      const user = await login(form);
      const dest = from || dashboardMap[user.role] || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => {
    setForm({ email, password });
    setError('');
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#09120e] text-stone-900 dark:text-stone-100 flex flex-col justify-center items-center px-4 py-12 relative transition-colors duration-200">
      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5">
        <ThemeToggle showLabel size="sm" />
      </div>

      <div className="w-full max-w-md space-y-7">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-white shadow-lg shadow-emerald-900/15 border border-emerald-500/20">
            <GraduationCap className="w-7 h-7 text-amber-300" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
            Welcome to <span className="text-emerald-700 dark:text-emerald-400">ExamPortal</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Secure, authoritative academic assessment platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-emerald-950/30 transition-colors">
          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-800 dark:text-rose-200 text-sm">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4.5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5" htmlFor="email">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@university.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-900/10 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-200 dark:border-emerald-950/80 text-center">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              New student to the portal?{' '}
              <Link to="/register" className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold inline-flex items-center gap-1">
                <span>Create an account</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>

        {/* Quick Demo Accounts */}
        <div className="bg-white/70 dark:bg-[#112019]/70 border border-stone-200 dark:border-emerald-950/80 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Quick Demo Accounts
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Click to fill</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                role: 'Student',
                email: 'student@example.com',
                password: 'Student@123',
                style: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
              },
              {
                role: 'Teacher',
                email: 'teacher@example.com',
                password: 'Teacher@123',
                style: 'bg-stone-50 text-stone-800 border-stone-200 dark:bg-[#162a20] dark:text-stone-200 dark:border-emerald-900/60 hover:bg-stone-100 dark:hover:bg-[#1d3529]',
              },
              {
                role: 'Admin',
                email: 'admin@example.com',
                password: 'Admin@123',
                style: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40',
              },
            ].map(({ role, email, password, style }) => (
              <button
                key={role}
                type="button"
                onClick={() => fillDemo(email, password)}
                className={`py-2 px-2.5 rounded-lg border text-center transition-all cursor-pointer shadow-2xs ${style}`}
              >
                <div className="text-xs font-bold leading-tight">{role}</div>
                <div className="text-[10px] opacity-75">Auto-fill</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
