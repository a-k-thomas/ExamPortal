import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getAdminOverview, getAdminExams } from '../../services/reportService';
import {
  Award,
  BarChart2,
  BookOpen,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Users,
  GraduationCap,
} from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const AdminReports = () => {
  const [overview, setOverview] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchAdminReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewData, examsData] = await Promise.all([
        getAdminOverview(),
        getAdminExams({ search, status: statusFilter }),
      ]);
      setOverview(overviewData.overview || null);
      setExams(examsData.exams || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load administrator reports.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchAdminReports();
  }, [fetchAdminReports]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Platform Examination Analytics"
          subtitle="Global system monitoring, aggregate performance statistics, and institutional reporting."
          badge="Executive Intelligence"
          actions={
            <button
              onClick={fetchAdminReports}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 shadow-sm transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
              <span>Refresh</span>
            </button>
          }
        />

        {error && (
          <div className="p-4 rounded-xl text-xs font-medium bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 shadow-sm">
            {error}
          </div>
        )}

        {/* Global Platform KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total Students"
            value={overview?.totalStudents || 0}
            icon={GraduationCap}
            variant="neutral"
            caption="Registered examinees"
          />
          <StatCard
            label="Total Teachers"
            value={overview?.totalTeachers || 0}
            icon={Users}
            variant="emerald"
            caption="Faculty creators"
          />
          <StatCard
            label="Examinations"
            value={overview?.totalExams || 0}
            icon={BookOpen}
            variant="gold"
            caption="Scheduled assessments"
          />
          <StatCard
            label="Total Attempts"
            value={overview?.totalAttempts || 0}
            icon={Clock}
            variant="neutral"
            caption="Student sittings"
          />
        </div>

        {/* Second KPI row: Completed, Average Score, Average Percentage, Pass Rate */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Completed Sittings"
            value={overview?.completedAttempts || 0}
            icon={CheckCircle2}
            variant="emerald"
            caption="Evaluated exams"
          />
          <StatCard
            label="Platform Avg Score"
            value={overview?.averageScore || 0}
            icon={Award}
            variant="gold"
            caption="Mean candidate marks"
          />
          <StatCard
            label="Average Percentage"
            value={`${overview?.averagePercentage || 0}%`}
            icon={BarChart2}
            variant="neutral"
            caption="Global performance"
          />
          <StatCard
            label="Global Pass Rate"
            value={`${overview?.passPercentage || 0}%`}
            icon={CheckCircle2}
            variant="emerald"
            caption={`${overview?.passCount || 0} pass • ${overview?.failCount || 0} fail`}
          />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400 dark:text-stone-500" />
            <input
              type="text"
              placeholder="Search exams by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl pl-10 pr-4 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-xs">
            <span className="text-stone-500 dark:text-stone-400 font-medium">Filter by Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-1.5 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* System-Wide Examinations Report Table */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/30">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">System Examinations & Performance</h3>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">Total: {exams.length} Examinations</span>
          </div>

          {loading ? (
            <div className="p-12">
              <LoadingSpinner message="Loading platform examination reports..." />
            </div>
          ) : exams.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={BarChart2}
                title="No examinations found"
                description="No examinations found matching your filter criteria."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Examination</th>
                    <th className="px-5 py-3.5">Teacher</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Attempts</th>
                    <th className="px-5 py-3.5">Avg Score</th>
                    <th className="px-5 py-3.5">Pass Rate</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {exams.map((exam) => (
                    <tr key={exam.examId} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition">
                      <td className="px-5 py-4">
                        <Link
                          to={`/admin/exams/${exam.examId}/report`}
                          className="font-semibold text-stone-900 dark:text-stone-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                        >
                          {exam.title}
                        </Link>
                        <div className="text-stone-400 dark:text-stone-500 text-[11px] mt-0.5 font-mono">
                          {exam.duration} mins &bull; Created {new Date(exam.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-stone-800 dark:text-stone-200">{exam.teacher?.name || 'Unknown'}</div>
                        <div className="text-stone-400 dark:text-stone-500 text-[11px] font-mono">{exam.teacher?.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={exam.status} />
                      </td>
                      <td className="px-5 py-4 font-mono">
                        <span className="font-bold text-stone-900 dark:text-stone-100">{exam.completedAttempts}</span>
                        <span className="text-stone-400 dark:text-stone-500 text-[11px]"> / {exam.totalAttempts} total</span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {exam.averageScore}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono font-bold text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                          {exam.passPercentage}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/admin/exams/${exam.examId}/report`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                          <span>View Report</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
