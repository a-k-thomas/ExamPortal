import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getMyAttempts } from '../../services/attemptService';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Percent,
  RefreshCw,
  ShieldOff,
  TrendingUp,
} from 'lucide-react';

const StudentResults = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAttempts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyAttempts();
      setAttempts(data.attempts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your examination results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  const completedAttempts = attempts.filter((a) =>
    ['submitted', 'auto_submitted'].includes(a.status)
  );

  const avgPercentage =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) /
            completedAttempts.length
        )
      : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Examination Transcripts & Results"
          subtitle="Review verified academic scores, performance percentages, and completed session records."
          backTo="/student/dashboard"
          backLabel="Back to Dashboard"
          actions={
            <button
              onClick={fetchAttempts}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#112019] hover:bg-stone-100 dark:hover:bg-emerald-950/40 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-emerald-950/80 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-stone-500'}`} />
              <span>Refresh Records</span>
            </button>
          }
        />

        {/* Aggregate KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Sessions"
            value={attempts.length}
            subtitle="Started or completed exams"
            icon={BookOpen}
            variant="neutral"
          />
          <StatCard
            title="Evaluated Attempts"
            value={completedAttempts.length}
            subtitle="Authoritative scores generated"
            icon={CheckCircle2}
            variant="emerald"
          />
          <StatCard
            title="Overall Average"
            value={`${avgPercentage}%`}
            subtitle="Average across all completed tests"
            icon={Award}
            variant="gold"
          />
        </div>

        {/* Results List Card */}
        <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-stone-200 dark:border-emerald-950/80 flex items-center justify-between">
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm tracking-tight">
              Attempt History
            </h3>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              {attempts.length} records logged
            </span>
          </div>

          {loading ? (
            <div className="p-12">
              <LoadingSpinner label="Loading evaluated transcripts..." />
            </div>
          ) : error ? (
            <div className="p-12 text-center text-rose-600 dark:text-rose-400 text-sm">{error}</div>
          ) : attempts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <EmptyState
                icon={Award}
                title="No Exam Results Available"
                description="You haven't completed any examinations yet. Start an available test to view your scorecard here."
                action={
                  <Link
                    to="/student/exams"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Browse Scheduled Exams</span>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-[#0c1813] border-b border-stone-200 dark:border-emerald-950/80 text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Examination</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Score</th>
                    <th className="px-5 py-3.5">Percentage</th>
                    <th className="px-5 py-3.5">Submission Time</th>
                    <th className="px-5 py-3.5 text-right">Scorecard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-emerald-950/60">
                  {attempts.map((att) => {
                    const isCompleted = ['submitted', 'auto_submitted'].includes(att.status);
                    const isPass = att.percentage >= 50;

                    return (
                      <tr
                        key={att.attemptId}
                        className="hover:bg-stone-50/80 dark:hover:bg-emerald-950/20 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                            {att.examTitle}
                          </div>
                          <div className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5">
                            Duration: {att.duration} mins
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={att.status} />
                        </td>
                        <td className="px-5 py-4 font-mono">
                          {isCompleted ? (
                            <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                              {att.score}{' '}
                              <span className="text-stone-400 text-xs font-normal">
                                / {att.totalMarks}
                              </span>
                            </span>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {isCompleted ? (
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-xs inline-flex items-center gap-1 ${
                                isPass
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900'
                              }`}
                            >
                              {att.percentage}%
                            </span>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-stone-600 dark:text-stone-400 font-mono text-[11px]">
                          {att.submittedAt
                            ? new Date(att.submittedAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : new Date(att.startedAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {isCompleted ? (
                            <Link
                              to={`/student/exams/${att.attemptId}/result`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs cursor-pointer"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-300" />
                              <span>View Scorecard</span>
                            </Link>
                          ) : (
                            <Link
                              to={`/student/exams/${att.attemptId}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition shadow-2xs cursor-pointer"
                            >
                              <span>Resume</span>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentResults;
