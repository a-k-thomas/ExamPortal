import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAttempt, saveAnswer, submitAttempt } from '../../services/attemptService';
import ConfirmModal from '../../components/ConfirmModal';
import ExamCountdown from '../../components/ExamCountdown';
import ThemeToggle from '../../components/common/ThemeToggle';
import {
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Award,
  BookOpen,
  Lock,
  ArrowLeft,
  ShieldOff,
  Sparkles,
} from 'lucide-react';

const ExamTaking = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [attempt, setAttempt] = useState(null);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  // ── Phase 5C: submission guard ──────────────────────────────────────────────
  const isSubmittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Phase 5C: expired state ─────────────────────────────────────────────────
  const [clientExpired, setClientExpired] = useState(false);
  const textDebounceRef = useRef(null);

  // ─── Fetch attempt data ────────────────────────────────────────────────────
  const fetchAttemptData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAttempt(attemptId);
      setAttempt(data.attempt);
      setExam(data.exam);
      setQuestions(data.questions || []);

      const answersMap = {};
      if (Array.isArray(data.attempt?.answers)) {
        data.attempt.answers.forEach((ans) => {
          const qId = ans.question?._id || ans.question;
          if (qId && ans.selectedAnswer !== undefined && ans.selectedAnswer !== null) {
            answersMap[qId.toString()] = ans.selectedAnswer;
          }
        });
      }
      setSelectedAnswers(answersMap);

      if (data.attempt?.status === 'auto_submitted') {
        setClientExpired(true);
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        setError('Access denied. Please log in again.');
      } else if (status === 404) {
        setError('Examination attempt not found.');
      } else {
        setError(
          err.response?.data?.message || 'Failed to load examination attempt. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    fetchAttemptData();
  }, [fetchAttemptData]);

  const isReadOnly =
    attempt?.status === 'submitted' ||
    attempt?.status === 'auto_submitted' ||
    clientExpired;

  const serverDeadline = attempt?.deadline ?? null;

  // ─── Phase 5C: auto-submit when countdown reaches zero ────────────────────
  const handleCountdownExpire = useCallback(async () => {
    setClientExpired(true);

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      const result = await submitAttempt(attemptId, []);

      if (result?.attempt) {
        setAttempt((prev) => ({ ...prev, ...result.attempt }));
      }

      navigate(`/student/exams/${attemptId}/submitted`);
    } catch (err) {
      const status = err.response?.status;
      const serverData = err.response?.data;

      if (status === 410 || serverData?.code === 'ATTEMPT_EXPIRED' || serverData?.alreadySubmitted) {
        navigate(`/student/exams/${attemptId}/submitted`);
        return;
      }

      setError('Time expired. Your saved answers have been submitted. If this message persists, please contact support.');
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  }, [attemptId, navigate]);

  // ─── Unified Answer Persist Engine ──────────────────────────────────────────
  const persistAnswerToServer = async (qId, answerValue) => {
    setSaveStatus('saving');
    try {
      await saveAnswer(attemptId, qId, answerValue);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      const status = err.response?.status;
      const serverData = err.response?.data;

      if (status === 410 || serverData?.code === 'ATTEMPT_EXPIRED') {
        setClientExpired(true);
        setSaveStatus('idle');

        if (serverData?.attempt) {
          setAttempt((prev) => ({ ...prev, ...serverData.attempt }));
        }

        setTimeout(() => navigate(`/student/exams/${attemptId}/submitted`), 1500);
        return;
      }

      setSaveStatus('error');
    }
  };

  // ─── Handle Single Choice & True/False selection ───────────────────────────
  const handleSelectOption = async (optionText) => {
    if (isReadOnly || !questions[currentIndex]) return;
    const currentQ = questions[currentIndex];
    const qId = currentQ._id.toString();

    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionText }));
    await persistAnswerToServer(qId, optionText);
  };

  // ─── Handle Multiple Select checkbox toggle ────────────────────────────────
  const handleToggleMultiOption = async (optionText) => {
    if (isReadOnly || !questions[currentIndex]) return;
    const currentQ = questions[currentIndex];
    const qId = currentQ._id.toString();

    const currentList = Array.isArray(selectedAnswers[qId]) ? selectedAnswers[qId] : [];
    let updatedList;
    if (currentList.includes(optionText)) {
      updatedList = currentList.filter((item) => item !== optionText);
    } else {
      updatedList = [...currentList, optionText];
    }

    setSelectedAnswers((prev) => ({ ...prev, [qId]: updatedList }));
    await persistAnswerToServer(qId, updatedList);
  };

  // ─── Handle Short Answer text input ────────────────────────────────────────
  const handleTextAnswerChange = (val) => {
    if (isReadOnly || !questions[currentIndex]) return;
    const currentQ = questions[currentIndex];
    const qId = currentQ._id.toString();

    setSelectedAnswers((prev) => ({ ...prev, [qId]: val }));

    if (textDebounceRef.current) {
      clearTimeout(textDebounceRef.current);
    }

    textDebounceRef.current = setTimeout(() => {
      persistAnswerToServer(qId, val);
    }, 800);
  };

  const handleTextBlur = () => {
    if (isReadOnly || !questions[currentIndex]) return;
    const currentQ = questions[currentIndex];
    const qId = currentQ._id.toString();
    const val = selectedAnswers[qId] || '';

    if (textDebounceRef.current) {
      clearTimeout(textDebounceRef.current);
    }
    persistAnswerToServer(qId, val);
  };

  const handleGoToQuestion = (index) => {
    if (textDebounceRef.current && questions[currentIndex]) {
      clearTimeout(textDebounceRef.current);
      const qId = questions[currentIndex]._id.toString();
      persistAnswerToServer(qId, selectedAnswers[qId] || '');
    }

    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  };

  const handleOpenSubmitModal = () => {
    if (textDebounceRef.current && questions[currentIndex]) {
      clearTimeout(textDebounceRef.current);
      const qId = questions[currentIndex]._id.toString();
      persistAnswerToServer(qId, selectedAnswers[qId] || '');
    }
    if (!isReadOnly) setSubmitModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      const result = await submitAttempt(attemptId, []);
      setSubmitModalOpen(false);

      if (result?.attempt) {
        setAttempt((prev) => ({ ...prev, ...result.attempt }));
      }

      navigate(`/student/exams/${attemptId}/submitted`);
    } catch (err) {
      const serverData = err.response?.data;
      setSubmitModalOpen(false);

      if (err.response?.status === 410 || serverData?.alreadySubmitted) {
        navigate(`/student/exams/${attemptId}/submitted`);
        return;
      }

      setError(err.response?.data?.message || 'Failed to submit examination. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-[#09120e] flex flex-col items-center justify-center p-6 text-stone-600 dark:text-stone-300 space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wide">Securing session and loading examination...</p>
      </div>
    );
  }

  if (error && !attempt) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-[#09120e] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl max-w-md w-full p-8 text-center space-y-5 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50">Examination Access Error</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={() => navigate('/student/exams')}
            className="w-full py-2.5 rounded-xl font-semibold text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 transition cursor-pointer"
          >
            Return to Available Exams
          </button>
        </div>
      </div>
    );
  }

  const isQuestionAnswered = (val) => {
    if (val === undefined || val === null) return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'string') return val.trim().length > 0;
    if (typeof val === 'boolean') return true;
    return false;
  };

  const renderQuestionTypePill = (type) => {
    switch (type) {
      case 'MULTIPLE_SELECT':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
            Multiple Choice — Select Multiple
          </span>
        );
      case 'TRUE_FALSE':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
            True / False
          </span>
        );
      case 'SHORT_ANSWER':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
            Short Answer
          </span>
        );
      case 'SINGLE_CHOICE':
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
            Single Choice
          </span>
        );
    }
  };

  const getQuestionTypeInstruction = (type) => {
    switch (type) {
      case 'MULTIPLE_SELECT':
        return 'Select all that apply';
      case 'TRUE_FALSE':
        return 'Select one';
      case 'SHORT_ANSWER':
        return 'Type your answer';
      case 'SINGLE_CHOICE':
      default:
        return 'Select one answer';
    }
  };

  const currentQuestion = questions[currentIndex] || null;
  const answeredCount = questions.filter((q) =>
    isQuestionAnswered(selectedAnswers[q._id.toString()])
  ).length;
  const totalCount = questions.length;
  const unansweredCount = Math.max(0, totalCount - answeredCount);

  const submittedLabel =
    attempt?.status === 'auto_submitted' ? 'Auto-Submitted' : 'Submitted';

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#09120e] text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200">
      {/* ── Top Exam Header Bar ─────────────────────────────────────────────── */}
      <header className="h-16 bg-white/90 dark:bg-[#0c1813]/90 border-b border-stone-200 dark:border-emerald-950/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/student/exams')}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-emerald-950/50 transition cursor-pointer"
            title="Back to Exams List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-900 border border-emerald-500/20 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <GraduationCap className="w-5 h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-stone-900 dark:text-stone-100 text-sm sm:text-base truncate tracking-tight">
              {exam?.title}
            </h1>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-2">
              <span>Duration: {exam?.duration} mins</span>
              <span>&bull;</span>
              <span>Questions: {totalCount}</span>
            </p>
          </div>
        </div>

        {/* Header Right: save status + countdown + theme + submit */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Save status indicator */}
          {saveStatus === 'saving' && (
            <span className="text-xs text-amber-600 dark:text-amber-400 animate-pulse hidden sm:inline-flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-emerald-700 dark:text-emerald-400 hidden sm:inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-rose-600 dark:text-rose-400 hidden sm:inline-flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5" /> Save failed
            </span>
          )}

          {/* Phase 5C: Countdown Timer */}
          {serverDeadline && (
            <ExamCountdown
              deadline={serverDeadline}
              onExpire={handleCountdownExpire}
              disabled={isReadOnly}
            />
          )}

          <ThemeToggle size="sm" />

          {/* Submit / Submitted badge */}
          {isReadOnly ? (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                attempt?.status === 'auto_submitted'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{submittedLabel}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleOpenSubmitModal}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting…' : 'Submit Exam'}</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Status Banners ──────────────────────────────────────────────────── */}
      {clientExpired && !isReadOnly && (
        <div className="bg-rose-50 dark:bg-rose-950/70 border-b border-rose-300 dark:border-rose-800 px-6 py-2.5 flex items-center justify-center gap-2 text-xs text-rose-800 dark:text-rose-200 font-semibold">
          <ShieldOff className="w-4 h-4 shrink-0" />
          <span>Examination time has expired. Submitting your answers…</span>
        </div>
      )}

      {isReadOnly && !submitting && (
        <div
          className={`border-b px-6 py-2.5 flex items-center justify-center gap-2 text-xs font-semibold ${
            attempt?.status === 'auto_submitted'
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300'
              : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            {attempt?.status === 'auto_submitted'
              ? 'This examination was automatically submitted after the time limit. Responses are locked.'
              : 'This examination has been submitted and is currently in read-only review mode.'}
          </span>
        </div>
      )}

      {error && attempt && (
        <div className="bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900/60 px-6 py-2 text-xs text-rose-800 dark:text-rose-200 text-center font-medium">
          {error}
        </div>
      )}

      {/* ── Main Exam-Taking Workspace ──────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        {/* Left: Question + Options Viewport */}
        <div className="flex-1 flex flex-col space-y-5">
          {currentQuestion ? (
            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 sm:p-8 shadow-xs flex-1 flex flex-col justify-between space-y-6">
              {/* Question Header */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-emerald-950/60 pb-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800 text-xs font-bold rounded-lg shadow-2xs">
                      Question {currentIndex + 1} of {totalCount}
                    </span>
                    {renderQuestionTypePill(currentQuestion.questionType)}
                    {isQuestionAnswered(selectedAnswers[currentQuestion._id.toString()]) ? (
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Answered
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">
                        Unanswered
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                    <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>
                      Marks: <strong className="text-stone-900 dark:text-stone-100">{currentQuestion.marks}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                  {getQuestionTypeInstruction(currentQuestion.questionType)}
                </div>

                {/* Question Text */}
                <div className="text-base sm:text-lg font-medium text-stone-900 dark:text-stone-100 leading-relaxed">
                  {currentQuestion.questionText}
                </div>
              </div>

              {/* Question Inputs */}
              <div className="space-y-3 pt-2">
                {currentQuestion.questionType === 'SHORT_ANSWER' ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      disabled={isReadOnly}
                      value={selectedAnswers[currentQuestion._id.toString()] || ''}
                      onChange={(e) => handleTextAnswerChange(e.target.value)}
                      onBlur={handleTextBlur}
                      placeholder="Type your response here..."
                      className={`w-full p-4 rounded-xl border bg-stone-50/70 dark:bg-[#0c1813] border-stone-200 dark:border-emerald-950/70 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition ${
                        isReadOnly ? 'cursor-not-allowed opacity-80' : ''
                      }`}
                    />
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Type your answer clearly. Letter casing (capital or lowercase) and extra spaces will not affect your score.</span>
                    </p>
                  </div>
                ) : currentQuestion.questionType === 'TRUE_FALSE' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['True', 'False'].map((val) => {
                      const isSelected = selectedAnswers[currentQuestion._id.toString()] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => handleSelectOption(val)}
                          className={`text-left p-4 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-950 border-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-100 dark:border-emerald-400 shadow-2xs font-semibold'
                              : 'bg-stone-50/70 dark:bg-[#0c1813] border-stone-200 dark:border-emerald-950/70 text-stone-700 dark:text-stone-300 hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-stone-100 dark:hover:bg-emerald-950/30'
                          } ${isReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                          <span className="text-sm sm:text-base font-medium">{val}</span>
                          <span
                            className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-stone-300 dark:border-stone-700'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : currentQuestion.questionType === 'MULTIPLE_SELECT' ? (
                  <div className="space-y-3">
                    {currentQuestion.options.map((opt, optIdx) => {
                      const label = String.fromCharCode(65 + optIdx);
                      const selectedList = Array.isArray(selectedAnswers[currentQuestion._id.toString()])
                        ? selectedAnswers[currentQuestion._id.toString()]
                        : [];
                      const isSelected = selectedList.includes(opt);

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => handleToggleMultiOption(opt)}
                          className={`w-full text-left p-4 rounded-xl border flex items-center gap-3.5 transition group cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-950 border-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-100 dark:border-emerald-400 shadow-2xs'
                              : 'bg-stone-50/70 dark:bg-[#0c1813] border-stone-200 dark:border-emerald-950/70 text-stone-700 dark:text-stone-300 hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-stone-100 dark:hover:bg-emerald-950/30'
                          } ${isReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 transition ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60 group-hover:text-emerald-800 dark:group-hover:text-emerald-200'
                            }`}
                          >
                            {label}
                          </span>
                          <span className="text-sm font-medium leading-normal flex-1">{opt}</span>
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-stone-300 dark:border-stone-700'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* SINGLE_CHOICE */
                  <div className="space-y-3">
                    {currentQuestion.options.map((opt, optIdx) => {
                      const label = String.fromCharCode(65 + optIdx);
                      const isSelected = selectedAnswers[currentQuestion._id.toString()] === opt;

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => handleSelectOption(opt)}
                          className={`w-full text-left p-4 rounded-xl border flex items-center gap-3.5 transition group cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-950 border-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-100 dark:border-emerald-400 shadow-2xs'
                              : 'bg-stone-50/70 dark:bg-[#0c1813] border-stone-200 dark:border-emerald-950/70 text-stone-700 dark:text-stone-300 hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-stone-100 dark:hover:bg-emerald-950/30'
                          } ${isReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 transition ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60 group-hover:text-emerald-800 dark:group-hover:text-emerald-200'
                            }`}
                          >
                            {label}
                          </span>
                          <span className="text-sm font-medium leading-normal flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Navigation footer */}
              <div className="pt-6 border-t border-stone-200 dark:border-emerald-950/60 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleGoToQuestion(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <div className="text-xs text-stone-400 dark:text-stone-500 hidden sm:block">
                  {isReadOnly ? 'Read-only review mode' : 'Select an option to persist answer'}
                </div>

                <button
                  type="button"
                  onClick={() => handleGoToQuestion(currentIndex + 1)}
                  disabled={currentIndex === totalCount - 1}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-12 text-center text-stone-500">
              No questions found in this examination.
            </div>
          )}
        </div>

        {/* Right: Question Palette & Overview */}
        <aside className="w-full lg:w-80 space-y-5">
          <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-5 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                Question Palette
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Jump directly to any item</p>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs border-y border-stone-200 dark:border-emerald-950/60 py-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 shrink-0" />
                <span>
                  Answered: <strong>{answeredCount}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                <span className="w-3.5 h-3.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shrink-0" />
                <span>
                  Unanswered: <strong>{unansweredCount}</strong>
                </span>
              </div>
            </div>

            {/* Question tiles */}
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isAnswered = isQuestionAnswered(selectedAnswers[q._id.toString()]);
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q._id}
                    type="button"
                    onClick={() => handleGoToQuestion(idx)}
                    className={`h-10 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-amber-400 dark:ring-amber-300 ring-offset-2 ring-offset-stone-50 dark:ring-offset-[#112019] font-black'
                        : ''
                    } ${
                      isAnswered
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                        : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700/80'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Submit button (sidebar) */}
            {!isReadOnly && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenSubmitModal}
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting…' : 'Submit Examination'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Exam Summary Info */}
          <div className="bg-white/60 dark:bg-[#112019]/60 border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-5 space-y-3 text-xs text-stone-500 dark:text-stone-400">
            <h4 className="font-semibold text-stone-900 dark:text-stone-200 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Exam Information
            </h4>
            <div className="space-y-1.5 leading-relaxed">
              <p>
                Total Marks:{' '}
                <strong className="text-stone-800 dark:text-stone-200">{exam?.totalMarks || attempt?.totalMarks}</strong>
              </p>
              <p>
                Time Allowed:{' '}
                <strong className="text-stone-800 dark:text-stone-200">{exam?.duration} mins</strong>
              </p>
              {exam?.instructions && (
                <div className="pt-2 border-t border-stone-200 dark:border-emerald-950/60">
                  <span className="font-semibold text-stone-800 dark:text-stone-200 block mb-1">
                    Instructions:
                  </span>
                  <p className="line-clamp-3">{exam.instructions}</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Submit Confirmation Modal ────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={submitModalOpen}
        title="Submit Examination Confirmation"
        confirmText={submitting ? 'Submitting Responses...' : 'Confirm & Submit Final Answers'}
        cancelText="Return to Exam"
        confirmVariant={unansweredCount > 0 ? 'warning' : 'primary'}
        loading={submitting}
        onConfirm={handleConfirmSubmit}
        onClose={() => setSubmitModalOpen(false)}
      >
        <div className="space-y-4 text-xs">
          <p className="text-stone-600 dark:text-stone-300 text-xs sm:text-sm leading-relaxed">
            Please review your completion summary below. Once confirmed, your answers will be permanently locked and submitted for evaluation.
          </p>

          {/* Metric Overview Grid */}
          <div className="grid grid-cols-3 gap-2.5 py-1">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3 text-center">
              <span className="block text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Answered</span>
              <span className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{answeredCount}</span>
              <span className="block text-[10px] text-emerald-600 dark:text-emerald-400">of {totalCount}</span>
            </div>

            <div className={`rounded-xl p-3 text-center border ${
              unansweredCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'
                : 'bg-stone-50 dark:bg-[#0c1813] border-stone-200 dark:border-emerald-950/80'
            }`}>
              <span className={`block text-[11px] font-semibold uppercase tracking-wider ${
                unansweredCount > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-stone-500 dark:text-stone-400'
              }`}>Unanswered</span>
              <span className={`text-xl font-bold ${
                unansweredCount > 0 ? 'text-amber-900 dark:text-amber-100' : 'text-stone-700 dark:text-stone-300'
              }`}>{unansweredCount}</span>
              <span className="block text-[10px] text-stone-500 dark:text-stone-400">items</span>
            </div>

            <div className="bg-stone-50 dark:bg-[#0c1813] border border-stone-200 dark:border-emerald-950/80 rounded-xl p-3 text-center">
              <span className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Time Limit</span>
              <span className="text-sm font-bold font-mono text-stone-900 dark:text-stone-100 mt-1 block">
                {serverDeadline ? (
                  (() => {
                    const diffMs = new Date(serverDeadline).getTime() - Date.now();
                    if (diffMs <= 0) return 'Expired';
                    const mins = Math.ceil(diffMs / 60000);
                    return `${mins} min${mins === 1 ? '' : 's'}`;
                  })()
                ) : (
                  `${exam?.duration || 0} mins`
                )}
              </span>
              <span className="block text-[10px] text-stone-500 dark:text-stone-400">available</span>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>
                You have <strong>{unansweredCount} unanswered {unansweredCount === 1 ? 'question' : 'questions'}</strong>. Any questions left unanswered will receive 0 marks upon submission.
              </span>
            </div>
          )}
        </div>
      </ConfirmModal>
    </div>
  );
};

export default ExamTaking;
