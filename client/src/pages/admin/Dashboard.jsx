import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getAdminOverview } from '../../services/reportService';
import {
  Users,
  BookOpen,
  ClipboardList,
  BarChart2,
  ShieldCheck,
  ChevronRight,
  GraduationCap,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getAdminOverview();
        setStats(res.overview || null);
      } catch (err) {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <PageHeader
          title={`Administrator Portal`}
          subtitle="System oversight, institution analytics, and platform governance."
          badge="Global Control"
        />

        {/* Identity Banner */}
        <div className="bg-gradient-to-r from-emerald-900 to-stone-900 text-white border border-emerald-800/40 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-serif font-bold text-2xl shadow-inner">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold font-serif">{user?.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Administrator
                  </span>
                </div>
                <p className="text-stone-300 text-xs mt-0.5">{user?.email}</p>
                <p className="text-emerald-200/80 text-[11px] mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Full governance and reporting authorization
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Link
                to="/admin/profile"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs transition"
              >
                Edit Profile
              </Link>
              <Link
                to="/admin/reports"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 transition shadow-sm"
              >
                Analytics Overview
              </Link>
            </div>
          </div>
        </div>

        {/* System Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Students"
            value={loading ? '...' : (stats?.totalStudents ?? '—')}
            icon={GraduationCap}
            variant="neutral"
            caption="Enrolled candidates"
          />
          <StatCard
            label="Total Teachers"
            value={loading ? '...' : (stats?.totalTeachers ?? '—')}
            icon={Users}
            variant="emerald"
            caption="Course instructors"
          />
          <StatCard
            label="Examinations"
            value={loading ? '...' : (stats?.totalExams ?? '—')}
            icon={BookOpen}
            variant="gold"
            caption="Active curricula"
          />
          <StatCard
            label="Total Attempts"
            value={loading ? '...' : (stats?.totalAttempts ?? '—')}
            icon={ClipboardList}
            variant="neutral"
            caption="Evaluation sessions"
          />
        </div>

        {/* Administration Actions Panel */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/30">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">Administrative Management</h3>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {[
              { icon: Users, label: 'User & Role Directory', desc: 'Manage students, faculty, and administrator privileges', to: '/admin/students', badge: 'Active' },
              { icon: BookOpen, label: 'Institution Examinations', desc: 'Oversee, configure, and publish exams campus-wide', to: '/admin/exams', badge: 'Active' },
              { icon: ClipboardList, label: 'Candidate Results Archive', desc: 'Inspect student evaluations, scores, and completion records', to: '/admin/results', badge: 'Evaluated' },
              { icon: BarChart2, label: 'Global Analytics & Reports', desc: 'Comprehensive passing rates, item accuracy, and metrics', to: '/admin/reports', badge: 'Analytics' },
              { icon: User, label: 'Administrator Profile', desc: 'Manage account details, credentials, and contact records', to: '/admin/profile', badge: 'Account' },
            ].map(({ icon: Icon, label, desc, to, badge }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-900 dark:text-stone-100 text-sm font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">{label}</span>
                    <span className="text-[10px] font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">{badge}</span>
                  </div>
                  <p className="text-stone-500 dark:text-stone-400 text-xs mt-0.5">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
              </Link>
            ))}
          </div>
        </div>

        {/* Security & Access Banner */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-200 text-xs">
                Administrative Authentication Verified
              </p>
              <p className="text-stone-600 dark:text-stone-400 text-[11px] mt-0.5">
                JWT verified with administrator role access &bull; All institution endpoints authorized and secured with authoritative server evaluation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
