import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAttemptResult } from '../../services/attemptService';
import ThemeToggle from '../../components/common/ThemeToggle';
import StatusBadge from '../../components/StatusBadge';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Percent,
  ShieldCheck,
  ShieldOff,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  GraduationCap,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Info,
  Sparkles,
} from 'lucide-react';

const ExamResult = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [reviewFilter, setReviewFilter] = useState('ALL');

  const fetchResult = async () => {
    setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const data = await getAttemptResult(attemptId);
      setResult(data.result);

      // Default expand all questions for easy initial reading
      if (Array.isArray(data.result?.questions)) {
        const initExpanded = {};
        data.result.questions.forEach((q) => {
          initExpanded[q.questionId] = true;
        });
        setExpandedQuestions(initExpanded);
      }
    } catch (err) {
      const status = err.response?.status;
      const code = err.response?.data?.code;
      const message = err.response?.data?.message;

      setErrorCode(code || (status ? `HTTP_${status}` : 'NETWORK_ERROR'));

      if (status === 403) {
        setError('Access denied. You can only view your own examination results.');
      } else if (status === 404) {
        setError('Examination attempt or result not found.');
      } else if (status === 409 || code === 'RESULT_NOT_AVAILABLE') {
        setError('Examination result is not available yet because this attempt is still in progress.');
      } else {
        setError(message || 'Failed to load examination result. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (attemptId) {
      fetchResult();
    }
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-[#09120e] flex flex-col items-center justify-center p-6 text-stone-600 dark:text-stone-300 space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wide">Retrieving verified examination scorecard...</p>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-[#09120e] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-3xl max-w-md w-full p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            {errorCode === 'RESULT_NOT_AVAILABLE' || errorCode === 'HTTP_409' ? (
              <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            ) : (
              <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
              {errorCode === 'RESULT_NOT_AVAILABLE' || errorCode === 'HTTP_409'
                ? 'Result Pending Completion'
                : 'Unable to Retrieve Scorecard'}
            </h2>
            <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">{error}</p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={fetchResult}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/student/exams"
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 transition"
              >
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Available Exams
              </Link>
              <Link
                to="/student/dashboard"
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 transition"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAutoSubmitted = result.status === 'auto_submitted';

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const toggleQuestion = (qId) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const toggleAll = (expand) => {
    if (!result?.questions) return;
    const updated = {};
    result.questions.forEach((q) => {
      updated[q.questionId] = expand;
    });
    setExpandedQuestions(updated);
  };

  const questionsList = Array.isArray(result?.questions) ? result.questions : [];

  const correctCount = questionsList.filter((q) => q.status === 'CORRECT').length;
  const incorrectCount = questionsList.filter((q) => q.status === 'INCORRECT').length;
  const unansweredCount = questionsList.filter((q) => q.status === 'UNANSWERED').length;

  const filteredQuestions = questionsList.filter((q) => {
    if (reviewFilter === 'CORRECT') return q.status === 'CORRECT';
    if (reviewFilter === 'INCORRECT') return q.status === 'INCORRECT';
    if (reviewFilter === 'UNANSWERED') return q.status === 'UNANSWERED';
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#09120e] text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200">
      {/* Top Header */}
      <header className="h-16 bg-white/90 dark:bg-[#0c1813]/90 border-b border-stone-200 dark:border-emerald-950/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/student/results')}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-emerald-950/40 transition cursor-pointer"
            title="Back to Transcripts"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-900 border border-emerald-500/20 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Award className="w-5 h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-stone-900 dark:text-stone-100 text-sm sm:text-base truncate tracking-tight">
              Official Examination Scorecard
            </h1>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
              {result.examTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle size="sm" />
          <Link
            to="/student/results"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">All Transcripts</span>
          </Link>
          <Link
            to="/student/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Title & Status Card */}
        <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-emerald-950/60 pb-5">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Official Academic Performance Record
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
                {result.examTitle}
              </h2>
            </div>
            <div>
              <StatusBadge status={result.status} />
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Score Card */}
            <div className="bg-stone-50 dark:bg-[#0c1813] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Marks Awarded</span>
                <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-stone-900 dark:text-stone-50">
                {result.score}{' '}
                <span className="text-sm font-normal text-stone-500 dark:text-stone-400">
                  / {result.totalMarks}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Canonical server evaluation</p>
            </div>

            {/* Percentage Card */}
            <div className="bg-stone-50 dark:bg-[#0c1813] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Percentage</span>
                <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {result.percentage}%
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, result.percentage))}%` }}
                />
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-stone-50 dark:bg-[#0c1813] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Submission Mode</span>
                <Clock className="w-4 h-4 text-stone-400" />
              </div>
              <div className="text-lg sm:text-xl font-bold text-stone-800 dark:text-stone-200 capitalize">
                {isAutoSubmitted ? 'Auto-Submitted' : 'Submitted'}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {isAutoSubmitted ? 'Window deadline elapsed' : 'Student manual submit'}
              </p>
            </div>
          </div>
        </div>

        {/* Audit & Timing Card */}
        <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Session & Verification Records
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-stone-50 dark:bg-[#0c1813] border border-stone-200 dark:border-emerald-950/60 rounded-xl p-4 space-y-1">
              <span className="text-stone-500 dark:text-stone-400 block font-medium">Session Commenced</span>
              <span className="text-stone-800 dark:text-stone-200 font-mono">
                {formatDateTime(result.startedAt)}
              </span>
            </div>

            <div className="bg-stone-50 dark:bg-[#0c1813] border border-stone-200 dark:border-emerald-950/60 rounded-xl p-4 space-y-1">
              <span className="text-stone-500 dark:text-stone-400 block font-medium">Recorded Submission</span>
              <span className="text-stone-800 dark:text-stone-200 font-mono">
                {formatDateTime(result.submittedAt)}
              </span>
            </div>

            <div className="bg-stone-50 dark:bg-[#0c1813] border border-stone-200 dark:border-emerald-950/60 rounded-xl p-4 space-y-1">
              <span className="text-stone-500 dark:text-stone-400 block font-medium">Allotted Duration</span>
              <span className="text-stone-800 dark:text-stone-200">
                {result.duration ? `${result.duration} minutes` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Server-Side Verification Badge */}
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="leading-relaxed">
              <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                Authoritative Server-Side Evaluation Completed
              </span>
              <span>
                Scores, percentages, and timestamps are cryptographically verified and permanently locked by the backend scoring engine.
              </span>
            </div>
          </div>
        </div>

        {/* Question Review Section */}
        {questionsList.length > 0 && (
          <section className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-emerald-950/60 pb-5">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Question Review & Performance</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Examine your submitted responses, correct answers, and instructor explanations for all questions.
                </p>
              </div>

              {/* Expand / Collapse Controls */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => toggleAll(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={() => toggleAll(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => setReviewFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  reviewFilter === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                <span>All</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
                  {questionsList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setReviewFilter('CORRECT')}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  reviewFilter === 'CORRECT'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Correct</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-200/50 dark:bg-emerald-800/50">
                  {correctCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setReviewFilter('INCORRECT')}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  reviewFilter === 'INCORRECT'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>Incorrect</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-200/50 dark:bg-rose-800/50">
                  {incorrectCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setReviewFilter('UNANSWERED')}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  reviewFilter === 'UNANSWERED'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Unanswered</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200/50 dark:bg-amber-800/50">
                  {unansweredCount}
                </span>
              </button>
            </div>

            {/* Questions List */}
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-stone-500 dark:text-stone-400 text-xs">
                No questions found under the &quot;{reviewFilter}&quot; filter.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q) => {
                  const isExpanded = !!expandedQuestions[q.questionId];
                  const qType = q.questionType || 'SINGLE_CHOICE';

                  return (
                    <div
                      key={q.questionId}
                      className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                        q.status === 'CORRECT'
                          ? 'border-emerald-200 dark:border-emerald-900/50 bg-stone-50/60 dark:bg-[#0c1813]/60'
                          : q.status === 'INCORRECT'
                          ? 'border-rose-200 dark:border-rose-900/50 bg-stone-50/60 dark:bg-[#0c1813]/60'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-[#0c1813]/40'
                      }`}
                    >
                      {/* Card Summary Header (Clickable to toggle) */}
                      <button
                        type="button"
                        onClick={() => toggleQuestion(q.questionId)}
                        className="w-full p-4 sm:p-5 flex items-start justify-between gap-4 text-left transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      >
                        <div className="space-y-2 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold text-stone-900 dark:text-stone-100">
                              Question {q.order}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[11px] font-medium">
                              {qType === 'SINGLE_CHOICE' && 'Single Choice'}
                              {qType === 'MULTIPLE_SELECT' && 'Multiple Select'}
                              {qType === 'TRUE_FALSE' && 'True / False'}
                              {qType === 'SHORT_ANSWER' && 'Short Answer'}
                            </span>
                            {/* Status badge */}
                            {q.status === 'CORRECT' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Correct
                              </span>
                            )}
                            {q.status === 'INCORRECT' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                <X className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Incorrect
                              </span>
                            )}
                            {q.status === 'UNANSWERED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
                                <HelpCircle className="w-3 h-3 text-stone-500" /> Unanswered
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-stone-800 dark:text-stone-200 line-clamp-2">
                            {q.question}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                              q.marksAwarded > 0
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                            }`}
                          >
                            +{q.marksAwarded} / {q.maxMarks} marks
                          </span>
                          <span className="text-stone-400 dark:text-stone-500">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </span>
                        </div>
                      </button>

                      {/* Expanded Details Body */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 pt-0 space-y-4 border-t border-stone-200/60 dark:border-emerald-950/40 mt-1">
                          {/* Full Question Text */}
                          <div className="text-sm font-semibold text-stone-900 dark:text-stone-100 pt-3">
                            {q.question}
                          </div>

                          {/* Options / Answer Presentation based on type */}
                          {(qType === 'SINGLE_CHOICE' || qType === 'TRUE_FALSE') && (
                            <div className="space-y-2 pt-1">
                              <div className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                                Options & Submitted Selection
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {(q.options || []).map((opt, optIdx) => {
                                  const isSelected = q.studentAnswer === optIdx || q.studentAnswer === opt || String(q.studentAnswer) === String(optIdx);
                                  const isCorrect = q.correctAnswer === optIdx || q.correctAnswer === opt || String(q.correctAnswer) === String(optIdx);

                                  let optClasses = 'border-stone-200 dark:border-stone-800 bg-white dark:bg-[#112019] text-stone-700 dark:text-stone-300';
                                  let badge = null;

                                  if (isSelected && isCorrect) {
                                    optClasses = 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-semibold';
                                    badge = (
                                      <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                                        <Check className="w-3 h-3" /> Your Answer (Correct)
                                      </span>
                                    );
                                  } else if (isSelected && !isCorrect) {
                                    optClasses = 'border-rose-400 dark:border-rose-600 bg-rose-50/80 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 font-semibold';
                                    badge = (
                                      <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full">
                                        <X className="w-3 h-3" /> Your Answer (Incorrect)
                                      </span>
                                    );
                                  } else if (isCorrect) {
                                    optClasses = 'border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/30 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200';
                                    badge = (
                                      <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                                        <Check className="w-3 h-3" /> Correct Answer
                                      </span>
                                    );
                                  }

                                  return (
                                    <div
                                      key={optIdx}
                                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${optClasses}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-[11px] text-stone-500 shrink-0">
                                          {String.fromCharCode(65 + optIdx)}
                                        </span>
                                        <span>{opt}</span>
                                      </div>
                                      {badge}
                                    </div>
                                  );
                                })}
                              </div>
                              {q.isUnanswered && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 italic pt-1">
                                  No answer was selected for this question.
                                </p>
                              )}
                            </div>
                          )}

                          {qType === 'MULTIPLE_SELECT' && (
                            <div className="space-y-2 pt-1">
                              <div className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                                Options & Multiple Selections (Exact Match Required)
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {(() => {
                                  const correctSet = new Set(Array.isArray(q.correctAnswers) ? q.correctAnswers : []);
                                  const studentSet = new Set(Array.isArray(q.studentAnswer) ? q.studentAnswer : []);

                                  return (q.options || []).map((opt, optIdx) => {
                                    const isSelected = studentSet.has(opt);
                                    const isCorrect = correctSet.has(opt);

                                    let optClasses = 'border-stone-200 dark:border-stone-800 bg-white dark:bg-[#112019] text-stone-700 dark:text-stone-300';
                                    let badge = null;

                                    if (isSelected && isCorrect) {
                                      optClasses = 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-semibold';
                                      badge = (
                                        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                                          <Check className="w-3 h-3" /> Selected (Correct)
                                        </span>
                                      );
                                    } else if (isSelected && !isCorrect) {
                                      optClasses = 'border-rose-400 dark:border-rose-600 bg-rose-50/80 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 font-semibold';
                                      badge = (
                                        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full">
                                          <X className="w-3 h-3" /> Selected (Incorrect)
                                        </span>
                                      );
                                    } else if (isCorrect) {
                                      optClasses = 'border-dashed border-emerald-400 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200';
                                      badge = (
                                        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                                          <Check className="w-3 h-3" /> Correct Answer (Missed)
                                        </span>
                                      );
                                    }

                                    return (
                                      <div
                                        key={optIdx}
                                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${optClasses}`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-[11px] text-stone-500 shrink-0">
                                            {String.fromCharCode(65 + optIdx)}
                                          </span>
                                          <span>{opt}</span>
                                        </div>
                                        {badge}
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                              {q.isUnanswered && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 italic pt-1">
                                  No options were selected for this question.
                                </p>
                              )}
                            </div>
                          )}

                          {qType === 'SHORT_ANSWER' && (
                            <div className="space-y-3 pt-1">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                {/* Student's typed answer */}
                                <div className="space-y-1.5 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#112019]">
                                  <span className="font-semibold text-stone-500 dark:text-stone-400 block uppercase tracking-wider text-[11px]">
                                    Your Submitted Response
                                  </span>
                                  {q.isUnanswered || !q.studentAnswer ? (
                                    <p className="text-amber-600 dark:text-amber-400 italic font-mono">
                                      (No response submitted)
                                    </p>
                                  ) : (
                                    <p
                                      className={`font-mono text-sm font-semibold ${
                                        q.isCorrect
                                          ? 'text-emerald-700 dark:text-emerald-400'
                                          : 'text-rose-700 dark:text-rose-400'
                                      }`}
                                    >
                                      {q.studentAnswer}
                                    </p>
                                  )}
                                </div>

                                {/* Accepted Answer(s) */}
                                <div className="space-y-1.5 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20">
                                  <span className="font-semibold text-emerald-800 dark:text-emerald-300 block uppercase tracking-wider text-[11px]">
                                    Accepted Answer(s)
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(q.acceptedAnswers && q.acceptedAnswers.length > 0
                                      ? q.acceptedAnswers
                                      : [q.correctAnswer]
                                    ).map((ans, ansIdx) => (
                                      <span
                                        key={ansIdx}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-200 font-mono text-xs font-semibold"
                                      >
                                        {ans}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <p className="text-[11px] text-stone-400 dark:text-stone-500 italic">
                                * Short answers are evaluated case-insensitively with normalized whitespace.
                              </p>
                            </div>
                          )}

                          {/* Instructor Explanation Box */}
                          {q.explanation && q.explanation.trim() && (
                            <div className="mt-3 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 dark:border-amber-700/40 text-xs space-y-1.5">
                              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                                <Sparkles className="w-4 h-4" />
                                <span>Instructor Explanation</span>
                              </div>
                              <p className="text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                                {q.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Link
            to="/student/results"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>My Complete Transcripts</span>
          </Link>
          <Link
            to="/student/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ExamResult;
