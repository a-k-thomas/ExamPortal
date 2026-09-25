import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, AlertCircle, UserPlus, ArrowLeft } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = form;

    if (!name.trim() || !email || !password) {
      return setError('Please fill in all required fields.');
    }
    if (name.trim().length < 2) {
      return setError('Name must be at least 2 characters.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    setError('');
    try {
      await register({ name: name.trim(), email, password });
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Too short', colorClass: 'bg-rose-500 text-rose-500', pct: 20 };
    if (p.length < 8) return { label: 'Weak', colorClass: 'bg-amber-500 text-amber-500', pct: 40 };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: 'Moderate', colorClass: 'bg-amber-400 text-amber-500', pct: 60 };
    if (p.length >= 10) return { label: 'Very Strong', colorClass: 'bg-emerald-600 text-emerald-600', pct: 100 };
    return { label: 'Good', colorClass: 'bg-emerald-500 text-emerald-500', pct: 80 };
  };
  const strength = passwordStrength();

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
            Student Registration
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Create an academic account to take scheduled examinations
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Jane Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5" htmlFor="email">
                Email Address
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
                  placeholder="student@university.edu"
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
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
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
              {strength && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.colorClass.split(' ')[0]}`}
                      style={{ width: `${strength.pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-stone-500 dark:text-stone-400">Password strength</span>
                    <span className={`font-semibold ${strength.colorClass.split(' ')[1]}`}>
                      {strength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-900/10 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register Account</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-200 dark:border-emerald-950/80 text-center">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Already registered?{' '}
              <Link to="/login" className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />
                <span>Sign in here</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
