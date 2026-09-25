import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import QuestionModal from '../../components/QuestionModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  getExamById,
  deleteExam,
  publishExam,
  unpublishExam,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../../services/examService';
import {
  ArrowLeft,
  Clock,
  Calendar,
  BookOpen,
  Award,
  Edit,
  Trash2,
  Send,
  RotateCcw,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  XCircle,
  BarChart2,
} from 'lucide-react';

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

const ExamDetail = ({ basePath = '/teacher/exams', isAdmin = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(location.state?.flashMessage || '');

  // Modals state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'deleteExam' | 'publishExam' | 'unpublishExam' | 'deleteQuestion'
    targetData: null,
    loading: false,
  });

  const [questionModal, setQuestionModal] = useState({
    isOpen: false,
    editingQuestion: null,
    loading: false,
  });

  const fetchExamDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getExamById(id);
      setExam(data.exam);
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load exam details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamDetails();
  }, [id]);

  // Exam level actions
  const handleOpenConfirm = (type, targetData = null) => {
    setConfirmModal({
      isOpen: true,
      type,
      targetData,
      loading: false,
    });
  };

  const handleCloseConfirm = () => {
    setConfirmModal({
      isOpen: false,
      type: null,
      targetData: null,
      loading: false,
    });
  };

  const handleConfirmAction = async () => {
    const { type, targetData } = confirmModal;
    setConfirmModal((prev) => ({ ...prev, loading: true }));
    setError('');
    setSuccessMsg('');

    try {
      if (type === 'deleteExam') {
        await deleteExam(id);
        navigate(basePath, {
          state: { flashMessage: `Exam "${exam.title}" was deleted successfully.` },
        });
        return;
      } else if (type === 'publishExam') {
        await publishExam(id);
        setSuccessMsg('Exam published successfully. It is now active for eligible students.');
      } else if (type === 'unpublishExam') {
        await unpublishExam(id);
        setSuccessMsg('Exam unpublished and reverted to draft status.');
      } else if (type === 'deleteQuestion') {
        await deleteQuestion(targetData._id);
        setSuccessMsg('Question deleted successfully.');
      }

      handleCloseConfirm();
      await fetchExamDetails();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to perform ${type} action.`);
      handleCloseConfirm();
    }
  };

  // Question management actions
  const handleOpenAddQuestion = () => {
    setQuestionModal({
      isOpen: true,
      editingQuestion: null,
      loading: false,
    });
  };

  const handleOpenEditQuestion = (q) => {
    setQuestionModal({
      isOpen: true,
      editingQuestion: q,
      loading: false,
    });
  };

  const handleCloseQuestionModal = () => {
    setQuestionModal({
      isOpen: false,
      editingQuestion: null,
      loading: false,
    });
  };

  const handleSaveQuestion = async (payload) => {
    setQuestionModal((prev) => ({ ...prev, loading: true }));
    setError('');
    setSuccessMsg('');

    try {
      if (questionModal.editingQuestion) {
        await updateQuestion(questionModal.editingQuestion._id, payload);
        setSuccessMsg('Question updated successfully.');
      } else {
        await createQuestion(id, payload);
        setSuccessMsg('Question added successfully.');
      }

      handleCloseQuestionModal();
      await fetchExamDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save question.');
      setQuestionModal((prev) => ({ ...prev, loading: false }));
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

  if (loading && !exam) {
    return (
      <DashboardLayout>
        <div className="p-16 flex items-center justify-center">
          <LoadingSpinner message="Loading examination details..." size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !exam) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-center space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Error Loading Exam</h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm">{error}</p>
          <button
            onClick={() => navigate(basePath)}
            className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition"
          >
            Back to Exams
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(basePath)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Examinations
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-medium shadow-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-100">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-medium shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-800 dark:hover:text-rose-100">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Exam Overview Card */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  {exam.title}
                </h1>
                <StatusBadge status={exam.status} />
              </div>
              {exam.description && (
                <p className="text-stone-500 dark:text-stone-400 text-xs max-w-2xl">{exam.description}</p>
              )}
            </div>

            {/* Exam Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`${basePath}/${exam._id}/report`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 transition shadow-sm"
              >
                <BarChart2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> View Report
              </Link>

              <Link
                to={`${basePath}/${exam._id}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition"
              >
                <Edit className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" /> Edit Details
              </Link>

              {exam.status === 'draft' ? (
                <button
                  onClick={() => handleOpenConfirm('publishExam')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
                >
                  <Send className="w-3.5 h-3.5" /> Publish Exam
                </button>
              ) : exam.status === 'published' ? (
                <button
                  onClick={() => handleOpenConfirm('unpublishExam')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Revert to Draft
                </button>
              ) : null}

              <button
                onClick={() => handleOpenConfirm('deleteExam')}
                className="p-2 rounded-xl text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition"
                title="Delete Exam"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Key Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3.5">
              <span className="text-stone-500 dark:text-stone-400 text-xs flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Duration
              </span>
              <span className="text-base font-bold font-mono text-stone-900 dark:text-stone-100">{exam.duration} mins</span>
            </div>

            <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3.5">
              <span className="text-stone-500 dark:text-stone-400 text-xs flex items-center gap-1.5 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Questions
              </span>
              <span className="text-base font-bold font-mono text-stone-900 dark:text-stone-100">{questions.length} Items</span>
            </div>

            <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3.5">
              <span className="text-stone-500 dark:text-stone-400 text-xs flex items-center gap-1.5 mb-1">
                <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Total Marks
              </span>
              <span className="text-base font-bold font-mono text-stone-900 dark:text-stone-100">{totalMarks} Marks</span>
            </div>

            <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3.5">
              <span className="text-stone-500 dark:text-stone-400 text-xs flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" /> Permitted Window
              </span>
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block truncate">
                {formatDate(exam.startTime)}
              </span>
              <span className="text-[11px] text-stone-400 block truncate">
                until {formatDate(exam.endTime)}
              </span>
            </div>
          </div>

          {/* Instructions Block */}
          {exam.instructions && (
            <div className="bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Instructions for Examinees
              </h4>
              <p className="text-stone-700 dark:text-stone-300 text-xs leading-relaxed whitespace-pre-line">
                {exam.instructions}
              </p>
            </div>
          )}

          {/* Creator Attribution (Admin) */}
          {isAdmin && exam.createdBy && (
            <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800/60">
              <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Created by:</span>
              <strong className="text-stone-800 dark:text-stone-200 font-medium">
                {exam.createdBy.name} ({exam.createdBy.email})
              </strong>
            </div>
          )}
        </div>

        {/* Question Management Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2.5">
                Questions Management
                <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                  {questions.length}
                </span>
              </h2>
              <p className="text-stone-500 dark:text-stone-400 text-xs mt-0.5">
                Objective MCQs evaluated automatically upon student submission.
              </p>
            </div>

            <button
              onClick={handleOpenAddQuestion}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>

          {/* Question List */}
          {questions.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-800 rounded-2xl p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-stone-300 dark:text-stone-700 mx-auto" />
              <h4 className="text-base font-bold text-stone-800 dark:text-stone-200">No Questions Added Yet</h4>
              <p className="text-stone-500 dark:text-stone-400 text-xs max-w-sm mx-auto">
                This examination cannot be published until at least one question is configured.
              </p>
              <button
                onClick={handleOpenAddQuestion}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition mt-2"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Question
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div
                  key={q._id}
                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-emerald-300 dark:hover:border-emerald-800/80 transition"
                >
                  {/* Question header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                        Q{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {renderQuestionTypeBadge(q.questionType)}
                          <span className="text-xs text-stone-400">&bull;</span>
                          <span className="text-xs text-stone-500 dark:text-stone-400">
                            Marks: <strong className="text-stone-800 dark:text-stone-200 font-mono">{q.marks}</strong>
                          </span>
                          <span className="text-xs text-stone-400">&bull;</span>
                          <span className="text-xs text-stone-500 dark:text-stone-400">
                            Order: <strong className="text-stone-800 dark:text-stone-200 font-mono">#{q.order}</strong>
                          </span>
                        </div>
                        <p className="text-stone-900 dark:text-stone-100 font-medium text-sm sm:text-base leading-snug">
                          {q.questionText}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEditQuestion(q)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                        title="Edit Question"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenConfirm('deleteQuestion', q)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Options / Answers Display based on questionType */}
                  {q.questionType === 'SHORT_ANSWER' ? (
                    <div className="pt-2 space-y-1.5">
                      <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                        Accepted Answers:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(q.acceptedAnswers?.length > 0 ? q.acceptedAnswers : [q.correctAnswer])
                          .filter(Boolean)
                          .map((ans, aIdx) => (
                            <span
                              key={aIdx}
                              className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200"
                            >
                              {ans}
                            </span>
                          ))}
                      </div>
                    </div>
                  ) : q.questionType === 'TRUE_FALSE' ? (
                    <div className="grid grid-cols-2 gap-2.5 pt-2">
                      {['True', 'False'].map((val) => {
                        const isCorrect = String(q.correctAnswer).trim().toLowerCase() === val.toLowerCase();
                        return (
                          <div
                            key={val}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100 font-semibold'
                                : 'bg-stone-50 dark:bg-stone-950/50 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            <span>{val}</span>
                            {isCorrect && (
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0 font-medium">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {q.options?.map((opt, optIdx) => {
                        const optLabel = String.fromCharCode(65 + optIdx);
                        const isCorrect =
                          q.questionType === 'MULTIPLE_SELECT'
                            ? (q.correctAnswers || []).includes(opt) || opt === q.correctAnswer
                            : opt === q.correctAnswer;

                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs transition ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100 font-semibold'
                                : 'bg-stone-50 dark:bg-stone-950/50 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[11px] font-bold shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                              }`}
                            >
                              {optLabel}
                            </span>
                            <span className="flex-1 break-words">{opt}</span>
                            {isCorrect && (
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0 font-medium">
                                Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={
            confirmModal.type === 'deleteExam'
              ? 'Permanently Delete Examination?'
              : confirmModal.type === 'publishExam'
              ? 'Publish Examination Now?'
              : confirmModal.type === 'unpublishExam'
              ? 'Revert Examination to Draft?'
              : 'Permanently Delete Question?'
          }
          message={
            confirmModal.type === 'deleteExam'
              ? `Are you sure you want to permanently delete "${exam?.title}"? All associated questions and candidate attempt records will be removed permanently. This action cannot be reversed.`
              : confirmModal.type === 'publishExam'
              ? `Publishing "${exam?.title}" makes it active and visible to eligible students during the scheduled window. Verify that all questions and marks are final before publishing.`
              : confirmModal.type === 'unpublishExam'
              ? `Reverting "${exam?.title}" to draft will hide it from student listings and prevent students from initiating new attempts.`
              : `Are you sure you want to delete this question? Total exam marks will automatically adjust. This action cannot be undone.`
          }
          confirmText={
            confirmModal.type === 'deleteExam'
              ? 'Permanently Delete Exam'
              : confirmModal.type === 'deleteQuestion'
              ? 'Permanently Delete Question'
              : confirmModal.type === 'publishExam'
              ? 'Confirm & Publish Exam'
              : 'Revert to Draft'
          }
          cancelText="Cancel"
          confirmVariant={
            confirmModal.type === 'deleteExam' || confirmModal.type === 'deleteQuestion'
              ? 'danger'
              : confirmModal.type === 'publishExam'
              ? 'primary'
              : 'warning'
          }
          loading={confirmModal.loading}
          onConfirm={handleConfirmAction}
          onClose={handleCloseConfirm}
        />

        {/* Question Modal (Add / Edit) */}
        <QuestionModal
          isOpen={questionModal.isOpen}
          initialData={questionModal.editingQuestion}
          defaultOrder={questions.length + 1}
          loading={questionModal.loading}
          onClose={handleCloseQuestionModal}
          onSubmit={handleSaveQuestion}
        />
      </div>
    </DashboardLayout>
  );
};

export default ExamDetail;
