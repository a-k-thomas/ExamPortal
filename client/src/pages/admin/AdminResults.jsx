import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getAdminExams, getExamStudentsReport } from '../../services/reportService';
import {
  ClipboardList,
  BarChart2,
  CheckCircle2,
  Clock,
  Search,
  ShieldOff,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const AdminResults = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load all platform exams
  const fetchAllExams = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAdminExams();
      const loadedExams = res.exams || [];
      setExams(loadedExams);
      if (loadedExams.length > 0 && !selectedExamId) {
        setSelectedExamId(loadedExams[0].examId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load examinations.');
    } finally {
      setLoading(false);
    }
  }, [selectedExamId]);

  // Load students for selected exam
  const fetchExamStudents = useCallback(async () => {
    if (!selectedExamId) return;
    setStudentsLoading(true);
    try {
      const res = await getExamStudentsReport(selectedExamId, {
        search,
        status: statusFilter,
      });
      setStudents(res.students || []);
    } catch (err) {
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }, [selectedExamId, search, statusFilter]);

  useEffect(() => {
    fetchAllExams();
  }, [fetchAllExams]);

  useEffect(() => {
    fetchExamStudents();
  }, [fetchExamStudents]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Platform Examination Results"
          subtitle="Institution-wide inspection of student attempts, marks awarded, and completion records."
          badge="Grading Records"
          actions={
            selectedExamId && (
              <Link
                to={`/admin/exams/${selectedExamId}/report`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Exam Analytics Report</span>
              </Link>
            )
          }
        />

        {error && (
          <div className="p-4 rounded-xl text-xs font-medium bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 shadow-sm">
            {error}
          </div>
        )}

        {/* Filters & Exam Selector */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium shrink-0">Filter by Exam:</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full sm:w-80 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-500"
            >
              {exams.map((ex) => (
                <option key={ex.examId} value={ex.examId}>
                  {ex.title} &bull; {ex.teacher?.name} ({ex.completedAttempts} completed)
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400 dark:text-stone-500" />
              <input
                type="text"
                placeholder="Search student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="auto_submitted">Auto-Submitted</option>
              <option value="in_progress">In-Progress</option>
            </select>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/30">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">Attempt Records</h3>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">Total: {students.length} Records</span>
          </div>

          {studentsLoading ? (
            <div className="p-12">
              <LoadingSpinner message="Loading attempt results..." />
            </div>
          ) : students.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={ClipboardList}
                title="No attempt records found"
                description="No examination attempts found for this selection."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Score</th>
                    <th className="px-5 py-3.5">Percentage</th>
                    <th className="px-5 py-3.5">Correct / Incorrect / Unanswered</th>
                    <th className="px-5 py-3.5">Submission Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {students.map((st) => {
                    const isPass = st.percentage >= 50;

                    return (
                      <tr key={st.attemptId} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-stone-900 dark:text-stone-100">{st.studentName}</div>
                          <div className="text-stone-400 dark:text-stone-500 text-[11px] font-mono">{st.studentEmail}</div>
                        </td>
                        <td className="px-5 py-4">
                          {st.status === 'submitted' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                              <CheckCircle2 className="w-3 h-3" /> Submitted
                            </span>
                          ) : st.status === 'auto_submitted' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                              <ShieldOff className="w-3 h-3" /> Auto-Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                              <Clock className="w-3 h-3" /> In-Progress
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-stone-900 dark:text-stone-100">
                          {st.score} <span className="text-stone-400 font-normal text-xs">/ {st.totalMarks}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-md font-mono font-bold text-xs ${
                              isPass
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
                            }`}
                          >
                            {st.percentage}%
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-stone-700 dark:text-stone-300">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{st.correctAnswers}</span> /{' '}
                          <span className="text-rose-600 dark:text-rose-400">{st.incorrectAnswers}</span> /{' '}
                          <span className="text-stone-400">{st.unansweredQuestions}</span>
                        </td>
                        <td className="px-5 py-4 text-stone-500 dark:text-stone-400 font-mono text-[11px]">
                          {st.submittedAt
                            ? new Date(st.submittedAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : new Date(st.startedAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
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

export default AdminResults;
