import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { getAvailableExams, getMyAttempts } from '../../services/attemptService';
import {
  BookOpen,
  Award,
  Calendar,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    availableCount: 0,
    completedCount: 0,
    avgScore: 0,
    recentAttempts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchDashboardData = async () => {
      try {
        const [availableData, attemptsData] = await Promise.allSettled([
          getAvailableExams(),
          getMyAttempts(),
        ]);

        if (!mounted) return;

        const available = availableData.status === 'fulfilled' ? availableData.value.exams || [] : [];
        const attempts = attemptsData.status === 'fulfilled' ? attemptsData.value.attempts || [] : [];

        const completed = attempts.filter((a) => ['submitted', 'auto_submitted'].includes(a.status));
        const avgPercentage =
          completed.length > 0
            ? Math.round(
                completed.reduce((acc, a) => acc + (a.percentage || 0), 0) / completed.length
              )
            : 0;

        setStats({
          availableCount: available.length,
          completedCount: completed.length,
          avgScore: avgPercentage,
          recentAttempts: attempts.slice(0, 3),
        });
      } catch {
        // Safe fallback
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={`Welcome, ${user?.name?.split(' ')[0] || 'Student'}`}
          subtitle="View available examinations, track your test attempts, and review performance scores."
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
              Active Student Session
            </span>
          }
          actions={
            <Link
              to="/student/exams"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse Exams</span>
            </Link>
          }
        />

        {/* Identity & Status Card */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-800 via-emerald-900 to-stone-900 text-white border border-emerald-700/50 shadow-md">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-700/60 border border-amber-300/40 text-amber-300 flex items-center justify-center text-2xl font-bold shadow-inner shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight text-stone-50">{user?.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Candidate
                  </span>
                </div>
                <p className="text-xs text-emerald-100/80">{user?.email}</p>
                <p className="text-[11px] text-emerald-200/60">
                  Registered: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Academic Session'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/student/profile"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 backdrop-blur-xs transition-colors"
              >
                Edit Profile
              </Link>
              <Link
                to="/student/results"
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold shadow-sm transition-colors"
              >
                View Transcripts
              </Link>
            </div>
          </div>
          {/* Subtle gold decorative glow */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Real-time KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Available Exams"
            value={loading ? '...' : stats.availableCount}
            subtitle="Ready to attempt now"
            icon={BookOpen}
            variant="emerald"
          />
          <StatCard
            title="Completed Exams"
            value={loading ? '...' : stats.completedCount}
            subtitle="Submitted & auto-submitted"
            icon={CheckCircle2}
            variant="neutral"
          />
          <StatCard
            title="Average Score"
            value={loading ? '...' : `${stats.avgScore}%`}
            subtitle="Across completed attempts"
            icon={TrendingUp}
            variant="gold"
          />
          <StatCard
            title="Account Status"
            value="Active"
            subtitle="Verified student credentials"
            icon={Award}
            variant="emerald"
          />
        </div>

        {/* Quick Actions & Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-[#112019] rounded-2xl border border-stone-200 dark:border-emerald-950/80 p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Exam Shortcuts
            </h3>
            <div className="space-y-2">
              {[
                {
                  label: 'Browse Exam Catalog',
                  sub: 'View all tests currently open for registration',
                  to: '/student/exams',
                  icon: BookOpen,
                  badge: 'Open Window',
                },
                {
                  label: 'My Examination Results',
                  sub: 'Review evaluated scorecards & percentages',
                  to: '/student/results',
                  icon: Award,
                  badge: 'Evaluated',
                },
                {
                  label: 'Profile & Credentials',
                  sub: 'Manage candidate name and account details',
                  to: '/student/profile',
                  icon: Calendar,
                  badge: 'Account',
                },
              ].map(({ label, sub, to, icon: Icon, badge }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-emerald-950/40 border border-stone-200/70 dark:border-emerald-900/40 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                        {label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
                        {badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                      {sub}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Exam Attempts */}
          <div className="lg:col-span-2 bg-white dark:bg-[#112019] rounded-2xl border border-stone-200 dark:border-emerald-950/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Recent Exam Activity
              </h3>
              <Link
                to="/student/results"
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-stone-400">Loading attempts...</div>
            ) : stats.recentAttempts.length === 0 ? (
              <div className="text-center py-8 space-y-2 border border-dashed border-stone-200 dark:border-emerald-900/60 rounded-xl">
                <Clock className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  No Exam Attempts Yet
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                  When you take scheduled tests, your attempts and score history will appear here.
                </p>
                <div className="pt-2">
                  <Link
                    to="/student/exams"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                  >
                    Take an Exam Now
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-emerald-950/60">
                {stats.recentAttempts.map((attempt) => (
                  <div
                    key={attempt.attemptId}
                    className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {attempt.examTitle}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {attempt.submittedAt
                          ? `Submitted: ${new Date(attempt.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                          : `Started: ${new Date(attempt.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={attempt.status} />
                      <div className="text-right">
                        <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          {attempt.score}/{attempt.totalMarks}
                        </span>
                        <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                          {attempt.percentage}%
                        </p>
                      </div>
                      <Link
                        to={`/student/exams/${attempt.attemptId}/result`}
                        className="p-1.5 text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg hover:bg-stone-100 dark:hover:bg-emerald-950/50"
                        title="View Scorecard"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
