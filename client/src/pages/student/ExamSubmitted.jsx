import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAttempt } from '../../services/attemptService';
import ThemeToggle from '../../components/common/ThemeToggle';
import StatusBadge from '../../components/StatusBadge';
import {
  CheckCircle2,
  BookOpen,
  Clock,
  LayoutDashboard,
  ShieldCheck,
  ShieldOff,
  AlertTriangle,
  Award,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';

const ExamSubmitted = () => {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) {
      setLoading(false);
      return;
    }

    const fetchSummary = async () => {
      try {
        const data = await getAttempt(attemptId);
        setAttempt(data.attempt);
        setExam(data.exam);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [attemptId]);

  const isAutoSubmitted = attempt?.status === 'auto_submitted';

  const formattedTime = attempt?.submittedAt
    ? new Date(attempt.submittedAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      })
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-[#09120e] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#09120e] text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center p-4 relative transition-colors duration-200">
      <div className="absolute top-5 right-5">
        <ThemeToggle showLabel size="sm" />
      </div>

      <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center space-y-6 shadow-xl transition-all">
        {/* Status Icon */}
        {isAutoSubmitted ? (
          <div className="w-18 h-18 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <ShieldOff className="w-9 h-9" />
          </div>
        ) : (
          <div className="w-18 h-18 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>
        )}

        {/* Heading */}
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
            {isAutoSubmitted ? 'Assessment Auto-Submitted' : 'Examination Submitted'}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
            {isAutoSubmitted
              ? 'The allotted test duration reached zero. All persisted responses were safely recorded and submitted to the evaluation engine.'
              : 'Your responses were securely transmitted to the examination engine for authoritative evaluation.'}
          </p>
        </div>

        {/* Details Card */}
        <div className="bg-stone-50 dark:bg-[#0c1813] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-4 sm:p-5 text-left text-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-stone-500 dark:text-stone-400">Examination:</span>
            <strong className="text-stone-900 dark:text-stone-100 text-right truncate">
              {exam?.title || 'Online Assessment'}
            </strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-stone-500 dark:text-stone-400">Submission Mode:</span>
            <StatusBadge status={attempt?.status || (isAutoSubmitted ? 'auto_submitted' : 'submitted')} />
          </div>

          {formattedTime && (
            <div className="flex items-center justify-between">
              <span className="text-stone-500 dark:text-stone-400">Recorded Timestamp:</span>
              <span className="text-stone-800 dark:text-stone-200 font-mono text-[11px]">{formattedTime}</span>
            </div>
          )}

          {exam?.duration && (
            <div className="flex items-center justify-between">
              <span className="text-stone-500 dark:text-stone-400">Allocated Duration:</span>
              <span className="text-stone-800 dark:text-stone-200">{exam.duration} minutes</span>
            </div>
          )}
        </div>

        {/* Security / Evaluation Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Server-authoritative evaluation completed</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-1">
          <Link
            to={`/student/exams/${attemptId}/result`}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm transition cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span>View Evaluated Scorecard</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/student/exams"
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Exam Catalog</span>
            </Link>
            <Link
              to="/student/dashboard"
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 transition cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamSubmitted;
