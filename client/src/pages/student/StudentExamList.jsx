import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { getAvailableExams, startAttempt } from '../../services/attemptService';
import {
  BookOpen,
  Clock,
  Calendar,
  Award,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  Search,
  X,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import {
  getExamSubject,
  getExamCode,
  getExamStatusCategory,
  matchesSearch,
} from '../../utils/examFilters';

const StudentExamList = () => {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [pendingStartExam, setPendingStartExam] = useState(null);

  // Search, Filters & Sorting Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');

  const fetchExams = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAvailableExams();
      setExams(data.exams || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load available examinations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // Dynamically extract unique subjects from available exams
  const availableSubjects = useMemo(() => {
    const subjects = new Set();
    exams.forEach((exam) => {
      const sub = getExamSubject(exam);
      if (sub) subjects.add(sub);
    });
    return Array.from(subjects).sort((a, b) => a.localeCompare(b));
  }, [exams]);

  // Determine if any search/filtering criteria is active
  const isFilterActive =
    Boolean(searchQuery.trim()) ||
    statusFilter !== 'ALL' ||
    subjectFilter !== 'ALL' ||
    sortBy !== 'DEFAULT';

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSubjectFilter('ALL');
    setSortBy('DEFAULT');
  };

  // Filter and sort the exams client-side
  const filteredAndSortedExams = useMemo(() => {
    let list = exams.filter((exam) => {
      // 1. Search query filter
      if (!matchesSearch(exam, searchQuery)) {
        return false;
      }

      // 2. Status filter
      if (statusFilter !== 'ALL') {
        const cat = getExamStatusCategory(exam);
        if (cat !== statusFilter) return false;
      }

      // 3. Subject filter
      if (subjectFilter !== 'ALL') {
        const sub = getExamSubject(exam);
        if (sub !== subjectFilter) return false;
      }

      return true;
    });

    // 4. Sorting logic
    if (sortBy === 'UPCOMING') {
      list = [...list].sort(
        (a, b) => new Date(a.startTime || 0) - new Date(b.startTime || 0)
      );
    } else if (sortBy === 'RECENT') {
      list = [...list].sort(
        (a, b) =>
          new Date(b.createdAt || b.startTime || 0) -
          new Date(a.createdAt || a.startTime || 0)
      );
    } else if (sortBy === 'TITLE_AZ') {
      list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return list;
  }, [exams, searchQuery, statusFilter, subjectFilter, sortBy]);

  const handleStartClick = (exam) => {
    if (exam.studentAttempt?.status === 'in_progress') {
      // Resume directly without modal
      executeStart(exam._id);
    } else {
      // Briefing modal before starting new attempt
      setPendingStartExam(exam);
    }
  };

  const executeStart = async (examId) => {
    setActionLoadingId(examId);
    setError('');
    try {
      const data = await startAttempt(examId);
      const attemptId = data.attempt?._id;
      if (!attemptId) {
        throw new Error('Server did not return an attempt identifier.');
      }
      setPendingStartExam(null);
      navigate(`/student/exams/${attemptId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start or resume examination attempt.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Available Examinations"
          subtitle="Select an active assessment within the scheduled window to initiate or resume your attempt."
          backTo="/student/dashboard"
          backLabel="Back to Dashboard"
          actions={
            <button
              onClick={fetchExams}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#112019] hover:bg-stone-100 dark:hover:bg-emerald-950/40 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-emerald-950/80 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-stone-500'}`} />
              <span>Refresh Schedule</span>
            </button>
          }
        />

        {/* Error notification */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 rounded-xl text-rose-800 dark:text-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Search and Filters Bar */}
        {!loading && exams.length > 0 && (
          <div className="space-y-3.5">
            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
              {/* Search input with icon and clear button */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search examinations..."
                  className="w-full pl-10 pr-9 py-2.5 bg-stone-50 dark:bg-[#0c1813] border border-stone-200 dark:border-emerald-950/60 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-500 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded-md transition cursor-pointer"
                    title="Clear search text"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filters & Sort Controls Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      aria-label="Filter by exam status"
                      className="w-full appearance-none px-3.5 py-2 pr-8 bg-stone-50 dark:bg-[#0c1813] border border-stone-200 dark:border-emerald-950/60 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
                    >
                      <option value="ALL">All Status</option>
                      <option value="AVAILABLE_NOW">Available Now</option>
                      <option value="UPCOMING">Upcoming</option>
                      <option value="CLOSED_COMPLETED">Closed / Completed</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Subject Filter */}
                  <div className="relative">
                    <select
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      aria-label="Filter by subject"
                      className="w-full appearance-none px-3.5 py-2 pr-8 bg-stone-50 dark:bg-[#0c1813] border border-stone-200 dark:border-emerald-950/60 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
                    >
                      <option value="ALL">All Subjects</option>
                      {availableSubjects.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Sort Control */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      aria-label="Sort examinations"
                      className="w-full appearance-none px-3.5 py-2 pr-8 bg-stone-50 dark:bg-[#0c1813] border border-stone-200 dark:border-emerald-950/60 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
                    >
                      <option value="DEFAULT">Sort: Schedule Order</option>
                      <option value="UPCOMING">Upcoming</option>
                      <option value="RECENT">Recently Added</option>
                      <option value="TITLE_AZ">Exam Title (A-Z)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Clear Filters Button (When filter is active) */}
                {isFilterActive && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </div>

            {/* Results Count Line */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
              <div className="font-medium">
                {isFilterActive ? (
                  <span>
                    Showing <strong className="text-stone-800 dark:text-stone-200">{filteredAndSortedExams.length}</strong> of {exams.length} matching {filteredAndSortedExams.length === 1 ? 'examination' : 'examinations'}
                  </span>
                ) : (
                  <span>
                    Showing <strong className="text-stone-800 dark:text-stone-200">{filteredAndSortedExams.length}</strong> {filteredAndSortedExams.length === 1 ? 'examination' : 'examinations'}
                  </span>
                )}
              </div>
              {isFilterActive && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  Reset all
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content list */}
        {loading ? (
          <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-16">
            <LoadingSpinner label="Querying scheduled examination timetable..." size="lg" />
          </div>
        ) : exams.length === 0 ? (
          /* Empty State 1: No examinations available at all */
          <EmptyState
            icon={BookOpen}
            title="No examinations are currently available."
            description="There are no published examinations currently scheduled within their testing window. Check back when your scheduled session opens."
            action={
              <button
                type="button"
                onClick={fetchExams}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check Again</span>
              </button>
            }
          />
        ) : filteredAndSortedExams.length === 0 ? (
          /* Empty State 2: Search/filter returns zero results */
          <EmptyState
            icon={Search}
            title="No examinations match your search or filters."
            description="We couldn't find any examinations matching your active search query or filter selections. Try adjusting your criteria or clearing filters."
            action={
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4.5">
            {filteredAndSortedExams.map((exam) => {
              const attempt = exam.studentAttempt;
              const isInProgress = attempt?.status === 'in_progress';
              const isSubmitted =
                attempt?.status === 'submitted' || attempt?.status === 'auto_submitted';
              const isActionLoading = actionLoadingId === exam._id;
              const examSubject = getExamSubject(exam);
              const statusCategory = getExamStatusCategory(exam);

              return (
                <div
                  key={exam._id}
                  className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 hover:border-emerald-300 dark:hover:border-emerald-800 rounded-2xl p-6 shadow-2xs transition-all duration-200 space-y-4"
                >
                  {/* Top line: title, status & start/resume button */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
                          {exam.title}
                        </h2>
                        {examSubject && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                            {examSubject}
                          </span>
                        )}
                        {statusCategory === 'UPCOMING' && <StatusBadge status="upcoming" />}
                        {statusCategory === 'AVAILABLE_NOW' && <StatusBadge status="active" />}
                        {statusCategory === 'CLOSED_COMPLETED' && !isSubmitted && (
                          <StatusBadge status="closed" />
                        )}
                        {isInProgress && <StatusBadge status="in_progress" />}
                        {isSubmitted && <StatusBadge status={attempt.status} />}
                      </div>
                      {exam.description && (
                        <p className="text-stone-600 dark:text-stone-400 text-xs sm:text-sm leading-relaxed max-w-3xl">
                          {exam.description}
                        </p>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="shrink-0 self-start sm:self-center">
                      {isSubmitted ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/student/exams/${attempt.attemptId}/submitted`)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 shadow-2xs transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>View Submission Record</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartClick(exam)}
                          disabled={isActionLoading}
                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer ${
                            isInProgress
                              ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                          }`}
                        >
                          {isActionLoading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Connecting to Exam Server...</span>
                            </>
                          ) : isInProgress ? (
                            <>
                              <RotateCcw className="w-4 h-4" />
                              <span>Resume In-Progress Attempt</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 text-amber-300" />
                              <span>Start Examination</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Instructions block if present */}
                  {exam.instructions && (
                    <div className="bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl p-3.5 text-xs text-stone-700 dark:text-stone-300 flex items-start gap-2.5">
                      <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-emerald-900 dark:text-emerald-300 block mb-0.5">
                          Examination Instructions:
                        </span>
                        <p className="line-clamp-2">{exam.instructions}</p>
                      </div>
                    </div>
                  )}

                  {/* Metadata footer */}
                  <div className="pt-3 border-t border-stone-100 dark:border-emerald-950/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-stone-500 dark:text-stone-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Time Limit: <strong className="text-stone-800 dark:text-stone-200">{exam.duration} mins</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Questions: <strong className="text-stone-800 dark:text-stone-200">{exam.questionCount}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                      <span>
                        Total Marks: <strong className="text-stone-800 dark:text-stone-200">{exam.totalMarks}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 shrink-0" />
                      <span>
                        Closes: <strong className="text-stone-800 dark:text-stone-200">{formatDate(exam.endTime)}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pre-Exam Start Confirmation Briefing Modal */}
        {pendingStartExam && (
          <ConfirmModal
            isOpen={Boolean(pendingStartExam)}
            title="Ready to Begin Examination?"
            confirmText={actionLoadingId ? 'Starting...' : 'I am Ready — Begin Exam'}
            cancelText="Not Yet, Go Back"
            confirmVariant="primary"
            loading={Boolean(actionLoadingId)}
            onConfirm={() => executeStart(pendingStartExam._id)}
            onClose={() => setPendingStartExam(null)}
          >
            <div className="space-y-4 text-xs">
              <p className="text-stone-600 dark:text-stone-300 text-xs sm:text-sm leading-relaxed">
                You are about to start <strong className="text-stone-900 dark:text-stone-100">{pendingStartExam.title}</strong>. Please review the details below before starting your timer.
              </p>

              <div className="grid grid-cols-3 gap-2.5 py-1">
                <div className="bg-stone-50 dark:bg-[#0c1813] border border-stone-200 dark:border-emerald-950/80 rounded-xl p-3 text-center">
                  <span className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Duration</span>
                  <span className="text-base font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5 block">{pendingStartExam.duration} mins</span>
                </div>
                <div className="bg-stone-50 dark:bg-[#0c1813] border border-stone-200 dark:border-emerald-950/80 rounded-xl p-3 text-center">
                  <span className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Questions</span>
                  <span className="text-base font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5 block">{pendingStartExam.questionCount} Items</span>
                </div>
                <div className="bg-stone-50 dark:bg-[#0c1813] border border-stone-200 dark:border-emerald-950/80 rounded-xl p-3 text-center">
                  <span className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Total Marks</span>
                  <span className="text-base font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5 block">{pendingStartExam.totalMarks} Marks</span>
                </div>
              </div>

              {pendingStartExam.instructions && (
                <div className="bg-stone-50 dark:bg-[#0c1813] border border-stone-200 dark:border-emerald-950/60 rounded-xl p-3 space-y-1">
                  <span className="font-semibold text-stone-800 dark:text-stone-200 block">Candidate Instructions:</span>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{pendingStartExam.instructions}</p>
                </div>
              )}

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-800 dark:text-emerald-300 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <span>
                  Once you begin, your {pendingStartExam.duration}-minute countdown will run continuously. Responses save automatically as you answer.
                </span>
              </div>
            </div>
          </ConfirmModal>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentExamList;
