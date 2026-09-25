import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  getExamReport,
  getExamStudentsReport,
  getExamQuestionsReport,
} from '../../services/reportService';
import {
  ArrowLeft,
  Award,
  BarChart2,
  CheckCircle2,
  Clock,
  Filter,
  HelpCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const renderQuestionTypeBadge = (type) => {
  switch (type) {
    case 'MULTIPLE_SELECT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
          Multiple Choice — Select Multiple
        </span>
      );
    case 'TRUE_FALSE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
          True / False
        </span>
      );
    case 'SHORT_ANSWER':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
          Short Answer
        </span>
      );
    case 'SINGLE_CHOICE':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
          Single Choice
        </span>
      );
  }
};

const ExamReport = ({ basePath = '/teacher/exams', isAdmin = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'students' | 'questions'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Overview report data
  const [report, setReport] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Students report state
  const [studentsData, setStudentsData] = useState({ students: [], pagination: {} });
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');

  // Question report state
  const [questionsData, setQuestionsData] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // 1. Fetch Overview Report
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await getExamReport(id, params);
      setReport(data.report);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load examination report.');
    } finally {
      setLoading(false);
    }
  }, [id, statusFilter, startDate, endDate]);

  // 2. Fetch Student Performance
  const fetchStudents = useCallback(async () => {
    setStudentsLoading(true);
    try {
      const params = {
        search: searchQuery,
        status: statusFilter,
        sortBy,
        sortOrder,
      };
      const data = await getExamStudentsReport(id, params);
      setStudentsData({
        students: data.students || [],
        pagination: data.pagination || {},
      });
    } catch (err) {
      // Non-blocking
    } finally {
      setStudentsLoading(false);
    }
  }, [id, searchQuery, statusFilter, sortBy, sortOrder]);

  // 3. Fetch Questions Performance
  const fetchQuestions = useCallback(async () => {
    setQuestionsLoading(true);
    try {
      const data = await getExamQuestionsReport(id);
      setQuestionsData(data.report?.questions || []);
    } catch (err) {
      // Non-blocking
    } finally {
      setQuestionsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    } else if (activeTab === 'questions') {
      fetchQuestions();
    }
  }, [activeTab, fetchStudents, fetchQuestions]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatSeconds = (sec) => {
    if (!sec && sec !== 0) return '—';
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    if (mins === 0) return `${remainingSec}s`;
    return `${mins}m ${remainingSec}s`;
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !report) {
    return (
      <DashboardLayout>
        <div className="p-16 flex items-center justify-center">
          <LoadingSpinner message="Generating comprehensive examination report..." size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !report) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-center space-y-4 shadow-sm">
          <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Report Access Error</h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm">{error}</p>
          <button
            onClick={() => navigate(basePath)}
            className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition"
          >
            Back to Examinations
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { exam, statistics } = report || {};

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation back and Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              onClick={() => navigate(`${basePath}/${id}`)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Exam Details
            </button>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-3">
              <span>{exam?.title}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-sans font-semibold border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50">
                Analytics Report
              </span>
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
              <span>Duration: {exam?.duration} mins</span>
              <span>&bull;</span>
              <span>Status: <strong className="text-stone-700 dark:text-stone-300 capitalize">{exam?.status}</strong></span>
              {exam?.createdBy && (
                <>
                  <span>&bull;</span>
                  <span>Created by: <strong className="text-stone-700 dark:text-stone-300">{exam.createdBy.name}</strong></span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchOverview();
                if (activeTab === 'students') fetchStudents();
                if (activeTab === 'questions') fetchQuestions();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 shadow-sm transition"
              title="Refresh Report Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Global Filters & Tabs Bar */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-stone-500 dark:text-stone-400 font-medium flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Filter Attempts:
            </span>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-1.5 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Attempt Statuses</option>
              <option value="submitted">Submitted Only</option>
              <option value="auto_submitted">Auto-Submitted Only</option>
              <option value="in_progress">In-Progress Only</option>
            </select>

            {/* Date Range Filters */}
            <div className="flex items-center gap-2">
              <span className="text-stone-400 dark:text-stone-500">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-2.5 py-1 text-stone-800 dark:text-stone-200 text-xs focus:outline-none focus:border-emerald-500"
              />
              <span className="text-stone-400 dark:text-stone-500">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-2.5 py-1 text-stone-800 dark:text-stone-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {(startDate || endDate || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setStatusFilter('all');
                }}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-950 p-1 rounded-xl border border-stone-200 dark:border-stone-800">
            {[
              { id: 'overview', label: 'Summary Overview', icon: BarChart2 },
              { id: 'students', label: 'Student Performance', icon: Users },
              { id: 'questions', label: 'Question Analysis', icon: HelpCircle },
            ].map(({ id: tabId, label, icon: Icon }) => (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === tabId
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB 1: OVERVIEW METRICS ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Primary KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Attempts"
                value={statistics?.totalAttempts || 0}
                icon={Users}
                variant="neutral"
                caption={`${statistics?.completedAttempts || 0} Completed • ${statistics?.inProgressAttempts || 0} In-Progress`}
              />

              <StatCard
                label="Average Score"
                value={statistics?.averageScore || 0}
                icon={Award}
                variant="gold"
                caption={`Avg Percentage: ${statistics?.averagePercentage || 0}%`}
              />

              <StatCard
                label="Pass Percentage"
                value={`${statistics?.passPercentage || 0}%`}
                icon={CheckCircle2}
                variant="emerald"
                caption={`${statistics?.passCount || 0} Passed • ${statistics?.failCount || 0} Failed`}
              />

              <StatCard
                label="Avg Completion Time"
                value={formatSeconds(statistics?.averageTimeTakenSeconds)}
                icon={Clock}
                variant="neutral"
                caption={`Allowed: ${exam?.duration || 0} mins`}
              />
            </div>

            {/* Score Range & Pass/Fail Visualization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Score Range Card */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Score Distribution Overview
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-4">
                    <span className="text-stone-500 dark:text-stone-400 text-xs flex items-center gap-1.5 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Highest Score
                    </span>
                    <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {statistics?.highestScore || 0}
                    </span>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-4">
                    <span className="text-stone-500 dark:text-stone-400 text-xs flex items-center gap-1.5 mb-1">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> Lowest Score
                    </span>
                    <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                      {statistics?.lowestScore || 0}
                    </span>
                  </div>
                </div>

                {/* Visual Pass Rate Meter */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400">
                    <span>Passing Rate ({statistics?.passPercentage || 0}%)</span>
                    <span>{statistics?.passCount || 0} / {statistics?.completedAttempts || 0} Students</span>
                  </div>
                  <div className="w-full h-3 bg-stone-100 dark:bg-stone-950 rounded-full overflow-hidden flex border border-stone-200 dark:border-stone-800">
                    <div
                      className="bg-emerald-600 dark:bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${statistics?.passPercentage || 0}%` }}
                    />
                    <div
                      className="bg-rose-500 h-full transition-all duration-500"
                      style={{ width: `${100 - (statistics?.passPercentage || 0)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-500">
                    <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Passed (&ge; 50%)
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Failed (&lt; 50%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Breakdown Card */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Attempt Status Breakdown
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                    <span className="text-xs text-stone-700 dark:text-stone-300 font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Student Submitted
                    </span>
                    <span className="font-bold font-mono text-stone-900 dark:text-stone-100 text-sm">
                      {report?.statistics?.completedAttempts
                        ? report.statistics.completedAttempts - (report.statistics.failCount || 0)
                        : 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                    <span className="text-xs text-stone-700 dark:text-stone-300 font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Auto-Submitted (Time Limit)
                    </span>
                    <span className="font-bold font-mono text-amber-600 dark:text-amber-400 text-sm">
                      {statistics?.completedAttempts || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                    <span className="text-xs text-stone-700 dark:text-stone-300 font-medium flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-stone-500 dark:text-stone-400" /> In-Progress
                    </span>
                    <span className="font-bold font-mono text-stone-700 dark:text-stone-300 text-sm">
                      {statistics?.inProgressAttempts || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action to view Questions / Students */}
            <div className="flex flex-wrap items-center justify-between p-5 bg-gradient-to-r from-emerald-50 to-amber-50/50 dark:from-emerald-950/20 dark:to-amber-950/10 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl gap-4 shadow-sm">
              <div>
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">Detailed Performance Breakdown</h4>
                <p className="text-stone-600 dark:text-stone-400 text-xs mt-0.5">
                  Inspect student-by-student scores or analyze question-level accuracy and distractor distributions.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('students')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                >
                  View Student List
                </button>
                <button
                  onClick={() => setActiveTab('questions')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition"
                >
                  Question Analysis
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: STUDENT PERFORMANCE ── */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            {/* Student Search & Sorting Bar */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400 dark:text-stone-500" />
                <input
                  type="text"
                  placeholder="Search by student name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl pl-10 pr-4 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 self-end sm:self-center font-mono">
                <span>Total records: <strong>{studentsData.students.length}</strong></span>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
              {studentsLoading ? (
                <div className="p-12">
                  <LoadingSpinner message="Loading student performance records..." />
                </div>
              ) : studentsData.students.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={Users}
                    title="No student attempts found"
                    description="No student attempts matched your search query or filters."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th
                          className="px-5 py-3.5 cursor-pointer hover:text-stone-900 dark:hover:text-stone-200 transition"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Student</span>
                            {sortBy === 'name' && (
                              sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </div>
                        </th>
                        <th className="px-5 py-3.5">Status</th>
                        <th
                          className="px-5 py-3.5 cursor-pointer hover:text-stone-900 dark:hover:text-stone-200 transition"
                          onClick={() => handleSort('score')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Score</span>
                            {sortBy === 'score' && (
                              sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </div>
                        </th>
                        <th
                          className="px-5 py-3.5 cursor-pointer hover:text-stone-900 dark:hover:text-stone-200 transition"
                          onClick={() => handleSort('percentage')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Percentage</span>
                            {sortBy === 'percentage' && (
                              sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </div>
                        </th>
                        <th className="px-5 py-3.5">Answers (C / I / U)</th>
                        <th
                          className="px-5 py-3.5 cursor-pointer hover:text-stone-900 dark:hover:text-stone-200 transition"
                          onClick={() => handleSort('timeTaken')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Time Taken</span>
                            {sortBy === 'timeTaken' && (
                              sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </div>
                        </th>
                        <th
                          className="px-5 py-3.5 cursor-pointer hover:text-stone-900 dark:hover:text-stone-200 transition"
                          onClick={() => handleSort('submittedAt')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Submission Date</span>
                            {sortBy === 'submittedAt' && (
                              sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {studentsData.students.map((student) => {
                        const isPass = student.percentage >= 50;

                        return (
                          <tr key={student.attemptId} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition">
                            <td className="px-5 py-4">
                              <div className="font-semibold text-stone-900 dark:text-stone-100">{student.studentName}</div>
                              <div className="text-stone-400 dark:text-stone-500 text-[11px] font-mono">{student.studentEmail}</div>
                            </td>
                            <td className="px-5 py-4">
                              {student.status === 'submitted' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                                  <CheckCircle2 className="w-3 h-3" /> Submitted
                                </span>
                              ) : student.status === 'auto_submitted' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                                  <Clock className="w-3 h-3" /> Auto-Submitted
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                                  <RefreshCw className="w-3 h-3" /> In-Progress
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 font-mono font-bold text-stone-900 dark:text-stone-100">
                              {student.score} <span className="text-stone-400 font-normal">/ {student.totalMarks}</span>
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                                  isPass
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
                                }`}
                              >
                                {student.percentage}%
                              </span>
                            </td>
                            <td className="px-5 py-4 font-mono text-stone-700 dark:text-stone-300">
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{student.correctAnswers}</span> /{' '}
                              <span className="text-rose-600 dark:text-rose-400">{student.incorrectAnswers}</span> /{' '}
                              <span className="text-stone-400">{student.unansweredQuestions}</span>
                            </td>
                            <td className="px-5 py-4 font-mono text-stone-500 dark:text-stone-400">
                              {formatSeconds(student.timeTakenSeconds)}
                            </td>
                            <td className="px-5 py-4 font-mono text-stone-500 dark:text-stone-400 text-[11px]">
                              {formatDateTime(student.submittedAt || student.startedAt)}
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
        )}

        {/* ── TAB 3: QUESTION BREAKDOWN ── */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-4">
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">Question-Level Accuracy & Option Distribution</h3>
                  <p className="text-stone-500 dark:text-stone-400 text-xs">
                    Evaluate item difficulty, common student misconceptions, and distractor effectiveness.
                  </p>
                </div>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                  Total Questions: <strong>{questionsData.length}</strong>
                </span>
              </div>

              {questionsLoading ? (
                <div className="p-12">
                  <LoadingSpinner message="Analyzing question performance..." />
                </div>
              ) : questionsData.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={HelpCircle}
                    title="No questions found"
                    description="No questions found in this examination."
                  />
                </div>
              ) : (
                <div className="space-y-6 pt-2">
                  {questionsData.map((q, idx) => {
                    const isHighAccuracy = q.accuracyPercentage >= 70;
                    const isLowAccuracy = q.accuracyPercentage < 40;

                    return (
                      <div
                        key={q.questionId}
                        className="bg-stone-50/60 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4"
                      >
                        {/* Question Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              {renderQuestionTypeBadge(q.questionType)}
                              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                                Question {q.order || idx + 1} &bull; {q.marks} Marks
                              </span>
                            </div>
                            <h4 className="text-stone-900 dark:text-stone-100 text-sm font-semibold pt-1 leading-relaxed">
                              {q.questionText}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-3 py-1 rounded-xl font-mono text-xs font-bold ${
                                isHighAccuracy
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                  : isLowAccuracy
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                              }`}
                            >
                              Accuracy: {q.accuracyPercentage}%
                            </span>
                          </div>
                        </div>

                        {/* Breakdown Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3">
                            <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Total Responses</span>
                            <span className="text-stone-900 dark:text-stone-100 font-bold font-mono text-base">{q.totalResponses}</span>
                          </div>
                          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3">
                            <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Correct Answers</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-base">{q.correctResponses}</span>
                          </div>
                          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3">
                            <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Incorrect Answers</span>
                            <span className="text-rose-600 dark:text-rose-400 font-bold font-mono text-base">{q.incorrectResponses}</span>
                          </div>
                          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3">
                            <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Unanswered</span>
                            <span className="text-stone-400 dark:text-stone-500 font-bold font-mono text-base">{q.unansweredResponses}</span>
                          </div>
                        </div>

                        {/* Option Distribution Bars */}
                        <div className="space-y-2 pt-1 border-t border-stone-200 dark:border-stone-800">
                          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">
                            Option Selection Distribution:
                          </span>
                          <div className="space-y-2">
                            {q.options?.map((opt, optIdx) => {
                              const label = String.fromCharCode(65 + optIdx);
                              const isCorrect = opt === q.correctAnswer;
                              const pickCount = q.optionDistribution?.[opt] || 0;
                              const pickPercent =
                                q.totalResponses > 0
                                  ? Math.round((pickCount / q.totalResponses) * 100)
                                  : 0;

                              return (
                                <div key={optIdx} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-2 text-stone-800 dark:text-stone-200">
                                      <span
                                        className={`w-5 h-5 rounded font-mono text-[10px] font-bold flex items-center justify-center ${
                                          isCorrect
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                                        }`}
                                      >
                                        {label}
                                      </span>
                                      <span className={isCorrect ? 'font-semibold text-emerald-700 dark:text-emerald-400' : ''}>
                                        {opt}
                                      </span>
                                      {isCorrect && (
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-bold">
                                          (Correct Answer)
                                        </span>
                                      )}
                                    </span>
                                    <span className="font-mono text-stone-500 dark:text-stone-400">
                                      {pickCount} ({pickPercent}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-stone-200 dark:bg-stone-900 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-300 ${
                                        isCorrect ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-stone-400 dark:bg-stone-700'
                                      }`}
                                      style={{ width: `${pickPercent}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}

                            {/* Unanswered option bar */}
                            {q.optionDistribution?.['unanswered'] > 0 && (
                              <div className="space-y-1 pt-1">
                                <div className="flex items-center justify-between text-xs text-stone-400 dark:text-stone-500">
                                  <span>Left Unanswered</span>
                                  <span className="font-mono">
                                    {q.optionDistribution['unanswered']} (
                                    {q.totalResponses > 0
                                      ? Math.round((q.optionDistribution['unanswered'] / q.totalResponses) * 100)
                                      : 0}
                                    %)
                                  </span>
                                </div>
                                <div className="w-full bg-stone-200 dark:bg-stone-900 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-stone-400 dark:bg-stone-800 rounded-full"
                                    style={{
                                      width: `${
                                        q.totalResponses > 0
                                          ? (q.optionDistribution['unanswered'] / q.totalResponses) * 100
                                          : 0
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ExamReport;
