import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { getTeacherOverview } from '../../services/reportService';
import {
  BookOpen,
  Users,
  BarChart2,
  CheckCircle2,
  PlusCircle,
  ClipboardList,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    totalExams: 0,
    publishedExams: 0,
    totalAttempts: 0,
    averagePercentage: 0,
    exams: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const res = await getTeacherOverview();
        if (mounted && res.success) {
          const exams = res.exams || [];
          const published = exams.filter((e) => e.status === 'published').length;
          const attempts = exams.reduce((acc, e) => acc + (e.totalAttempts || 0), 0);
          const avg =
            exams.length > 0
              ? Math.round(
                  exams.reduce((acc, e) => acc + (e.averagePercentage || 0), 0) / exams.length
                )
              : 0;

          setData({
            totalExams: exams.length,
            publishedExams: published,
            totalAttempts: attempts,
            averagePercentage: avg,
            exams: exams.slice(0, 4),
          });
        }
      } catch {
        // Fallback
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={`Faculty Portal — ${user?.name || 'Instructor'}`}
          subtitle="Manage examinations, question repositories, enrolled students, and analytical reports."
          actions={
            <Link
              to="/teacher/exams/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>Create New Exam</span>
            </Link>
          }
        />

        {/* Identity Card */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-800 via-emerald-900 to-stone-900 text-white border border-emerald-700/50 shadow-md">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-700/60 border border-amber-300/40 text-amber-300 flex items-center justify-center text-2xl font-bold shadow-inner shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight text-stone-50">{user?.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    Faculty Examiner
                  </span>
                </div>
                <p className="text-xs text-emerald-100/80">{user?.email}</p>
                <p className="text-[11px] text-emerald-200/60">
                  Role: Instructor / Assessment Creator
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/teacher/profile"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 backdrop-blur-xs transition-colors"
              >
                Edit Profile
              </Link>
              <Link
                to="/teacher/exams"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 backdrop-blur-xs transition-colors"
              >
                Manage Exams
              </Link>
              <Link
                to="/teacher/reports"
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold shadow-sm transition-colors"
              >
                View Analytics
              </Link>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="My Examinations"
            value={loading ? '...' : data.totalExams}
            subtitle="Authored assessments"
            icon={BookOpen}
            variant="emerald"
          />
          <StatCard
            title="Published Active"
            value={loading ? '...' : data.publishedExams}
            subtitle="Open in test window"
            icon={CheckCircle2}
            variant="neutral"
          />
          <StatCard
            title="Total Submissions"
            value={loading ? '...' : data.totalAttempts}
            subtitle="Student exam attempts"
            icon={Users}
            variant="neutral"
          />
          <StatCard
            title="Average Class Score"
            value={loading ? '...' : `${data.averagePercentage}%`}
            subtitle="Mean test accuracy"
            icon={TrendingUp}
            variant="gold"
          />
        </div>

        {/* Shortcuts & Recent Exams Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-[#112019] rounded-2xl border border-stone-200 dark:border-emerald-950/80 p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Instructor Shortcuts
            </h3>
            <div className="space-y-2">
              {[
                {
                  label: 'Author New Examination',
                  sub: 'Configure timing, marks, and question bank',
                  to: '/teacher/exams/create',
                  icon: PlusCircle,
                  badge: 'Create',
                },
                {
                  label: 'Manage Existing Exams',
                  sub: 'Edit draft questions or publish active tests',
                  to: '/teacher/exams',
                  icon: BookOpen,
                  badge: 'Manage',
                },
                {
                  label: 'Enrolled Student Roster',
                  sub: 'Inspect candidate directory and enrollments',
                  to: '/teacher/students',
                  icon: Users,
                  badge: 'Roster',
                },
                {
                  label: 'Comprehensive Reports',
                  sub: 'Analyze question distributions & pass rates',
                  to: '/teacher/reports',
                  icon: BarChart2,
                  badge: 'Reports',
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

          {/* Recent Exam Overview */}
          <div className="lg:col-span-2 bg-white dark:bg-[#112019] rounded-2xl border border-stone-200 dark:border-emerald-950/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                My Authored Examinations
              </h3>
              <Link
                to="/teacher/exams"
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-stone-400">Loading exams...</div>
            ) : data.exams.length === 0 ? (
              <div className="text-center py-8 space-y-2 border border-dashed border-stone-200 dark:border-emerald-900/60 rounded-xl">
                <BookOpen className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  No Examinations Authored Yet
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                  Create your first examination with multiple-choice questions to begin assessments.
                </p>
                <div className="pt-2">
                  <Link
                    to="/teacher/exams/create"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create Exam Now</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-emerald-950/60">
                {data.exams.map((ex) => (
                  <div
                    key={ex.examId}
                    className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {ex.title}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {ex.totalAttempts || 0} submissions &bull; Avg Score: {ex.averagePercentage || 0}%
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={ex.status} />
                      <Link
                        to={`/teacher/reports/${ex.examId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>Report</span>
                      </Link>
                      <Link
                        to={`/teacher/exams/${ex.examId}`}
                        className="p-1.5 text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg hover:bg-stone-100 dark:hover:bg-emerald-950/50"
                        title="Manage Exam"
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

export default TeacherDashboard;
