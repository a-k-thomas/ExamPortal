import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getTeacherOverview, getExamStudentsReport } from '../../services/reportService';
import {
  ClipboardList,
  BarChart2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Award,
  ChevronRight,
  ShieldOff,
} from 'lucide-react';

const TeacherResults = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load teacher's exams
  const fetchExams = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getTeacherOverview();
      const loadedExams = res.exams || res.report?.exams || [];
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
    fetchExams();
  }, [fetchExams]);

  useEffect(() => {
    fetchExamStudents();
  }, [fetchExamStudents]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Student Assessment Results"
          subtitle="Inspect individual student evaluations, submission modes, and question breakdown for your examinations."
          backTo="/teacher/dashboard"
          backLabel="Back to Dashboard"
          actions={
            selectedExamId ? (
              <Link
                to={`/teacher/exams/${selectedExamId}/report`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
              >
                <BarChart2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Open Full Analytics Report</span>
              </Link>
            ) : null
          }
        />

        {/* Filters & Exam Selector */}
        <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold shrink-0">
              Select Examination:
            </span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full sm:w-72 bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {exams.length === 0 ? (
                <option value="">No examinations available</option>
              ) : (
                exams.map((ex) => (
                  <option key={ex.examId} value={ex.examId}>
                    {ex.title} ({ex.completedAttempts || 0} completed)
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400 dark:text-stone-500" />
              <input
                type="text"
                placeholder="Search candidate name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 w-full sm:w-auto"
            >
              <option value="all">All Submission Modes</option>
              <option value="submitted">Submitted</option>
              <option value="auto_submitted">Auto-Submitted</option>
              <option value="in_progress">In-Progress</option>
            </select>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-stone-200 dark:border-emerald-950/80 flex items-center justify-between">
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm tracking-tight">
              Candidate Submissions & Grading
            </h3>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              {students.length} attempts recorded
            </span>
          </div>

          {studentsLoading ? (
            <div className="p-12">
              <LoadingSpinner label="Querying student evaluations..." />
            </div>
          ) : students.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No Evaluation Records Found"
              description="There are no candidate attempts matching the current filter criteria for this examination."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-[#0c1813] border-b border-stone-200 dark:border-emerald-950/80 text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Candidate</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Score</th>
                    <th className="px-5 py-3.5">Percentage</th>
                    <th className="px-5 py-3.5">Correct / Incorrect / Blank</th>
                    <th className="px-5 py-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-emerald-950/60">
                  {students.map((st) => {
                    const isPass = st.percentage >= 50;

                    return (
                      <tr
                        key={st.attemptId}
                        className="hover:bg-stone-50/80 dark:hover:bg-emerald-950/20 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                            {st.studentName}
                          </div>
                          <div className="text-stone-500 dark:text-stone-400 text-[11px]">{st.studentEmail}</div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={st.status} />
                        </td>
                        <td className="px-5 py-4 font-mono">
                          <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                            {st.score}
                          </span>{' '}
                          <span className="text-stone-400 text-xs">/ {st.totalMarks}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-xs inline-flex items-center gap-1 ${
                              isPass
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900'
                            }`}
                          >
                            {st.percentage}%
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-stone-600 dark:text-stone-300">
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{st.correctAnswers}</span> /{' '}
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

export default TeacherResults;
