import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  getExams,
  deleteExam,
  publishExam,
  unpublishExam,
} from '../../services/examService';
import {
  Plus,
  Search,
  BookOpen,
  Clock,
  Calendar,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Send,
  RotateCcw,
  User as UserIcon,
  BarChart2,
} from 'lucide-react';

const ExamList = ({ basePath = '/teacher/exams', isAdmin = false }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [modalState, setModalState] = useState({
    type: null, // 'delete' | 'publish' | 'unpublish'
    exam: null,
    loading: false,
  });

  const fetchExamData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await getExams(params);
      setExams(data.exams || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load examinations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamData();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchExamData();
  };

  // Action handlers
  const handleOpenModal = (type, exam) => {
    setModalState({ type, exam, loading: false });
  };

  const handleCloseModal = () => {
    setModalState({ type: null, exam: null, loading: false });
  };

  const handleConfirmAction = async () => {
    const { type, exam } = modalState;
    if (!exam) return;

    setModalState((prev) => ({ ...prev, loading: true }));
    setError('');
    setSuccessMsg('');

    try {
      if (type === 'delete') {
        await deleteExam(exam._id);
        setSuccessMsg(`Exam "${exam.title}" and its questions deleted successfully.`);
      } else if (type === 'publish') {
        await publishExam(exam._id);
        setSuccessMsg(`Exam "${exam.title}" is now published.`);
      } else if (type === 'unpublish') {
        await unpublishExam(exam._id);
        setSuccessMsg(`Exam "${exam.title}" reverted to draft status.`);
      }

      handleCloseModal();
      await fetchExamData();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${type} exam.`);
      handleCloseModal();
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <PageHeader
          title={isAdmin ? 'All Examinations' : 'My Examinations'}
          subtitle={
            isAdmin
              ? 'Oversee, configure, and manage examinations across all instructors.'
              : 'Create, organize questions, and manage your scheduled examinations.'
          }
          badge={isAdmin ? 'Institution Registry' : 'Faculty Coursework'}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={fetchExamData}
                disabled={loading}
                className="p-2.5 rounded-xl bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 shadow-sm transition"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
              </button>
              <Link
                to={`${basePath}/create`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Create Exam
              </Link>
            </div>
          }
        />

        {/* Feedback alerts */}
        {successMsg && (
          <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-medium shadow-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
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

        {/* Filters and Search Bar */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl w-full md:w-auto overflow-x-auto">
            {[
              { label: 'All', value: '' },
              { label: 'Drafts', value: 'draft' },
              { label: 'Published', value: 'published' },
              { label: 'Archived', value: 'archived' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  statusFilter === tab.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search exams by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Exams List / Cards */}
        {loading ? (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-16 shadow-sm">
            <LoadingSpinner message="Loading examinations..." />
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center space-y-4 shadow-sm">
            <EmptyState
              icon={BookOpen}
              title="No Examinations Found"
              description={
                statusFilter || searchQuery
                  ? 'No exams match the selected filter criteria. Try clearing the filter.'
                  : 'Get started by creating your first online examination.'
              }
              actionLabel="Create Exam"
              actionLink={`${basePath}/create`}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {exams.map((exam) => (
              <div
                key={exam._id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-800/80 rounded-2xl p-5 transition shadow-sm space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link
                        to={`${basePath}/${exam._id}`}
                        className="text-lg font-bold text-stone-900 dark:text-stone-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition tracking-tight"
                      >
                        {exam.title}
                      </Link>
                      <StatusBadge status={exam.status} />
                    </div>
                    {exam.description && (
                      <p className="text-stone-500 dark:text-stone-400 text-xs line-clamp-1">{exam.description}</p>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                    <Link
                      to={`${basePath}/${exam._id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition"
                      title="View Exam and Questions"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> View
                    </Link>

                    <Link
                      to={`${basePath}/${exam._id}/report`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 transition"
                      title="View Analytics Report"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Report
                    </Link>

                    <Link
                      to={`${basePath}/${exam._id}/edit`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition"
                      title="Edit Exam"
                    >
                      <Edit className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" /> Edit
                    </Link>

                    {exam.status === 'draft' ? (
                      <button
                        onClick={() => handleOpenModal('publish', exam)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 transition"
                        title="Publish Exam"
                      >
                        <Send className="w-3.5 h-3.5" /> Publish
                      </button>
                    ) : exam.status === 'published' ? (
                      <button
                        onClick={() => handleOpenModal('unpublish', exam)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 transition"
                        title="Unpublish (Revert to Draft)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Unpublish
                      </button>
                    ) : null}

                    <button
                      onClick={() => handleOpenModal('delete', exam)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-stone-500 dark:text-stone-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Duration: <strong className="text-stone-800 dark:text-stone-200">{exam.duration} mins</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      Questions:{' '}
                      <strong className="text-stone-800 dark:text-stone-200">
                        {exam.questionCount !== undefined ? exam.questionCount : '—'}
                      </strong>{' '}
                      {exam.totalMarks !== undefined && (
                        <span className="text-stone-400">({exam.totalMarks} marks)</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Starts: <strong className="text-stone-800 dark:text-stone-200">{formatDate(exam.startTime)}</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Ends: <strong className="text-stone-800 dark:text-stone-200">{formatDate(exam.endTime)}</strong></span>
                  </div>
                </div>

                {/* Creator info badge for Admin */}
                {isAdmin && exam.createdBy && (
                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800/60 flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                    <UserIcon className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Created by:</span>
                    <strong className="text-stone-800 dark:text-stone-200 font-medium">
                      {exam.createdBy.name} ({exam.createdBy.email})
                    </strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={!!modalState.type}
          title={
            modalState.type === 'delete'
              ? 'Delete Examination?'
              : modalState.type === 'publish'
              ? 'Publish Examination?'
              : 'Unpublish Examination?'
          }
          message={
            modalState.type === 'delete'
              ? `Are you sure you want to permanently delete "${modalState.exam?.title}"? All associated questions will also be removed. This action cannot be undone.`
              : modalState.type === 'publish'
              ? `Publishing "${modalState.exam?.title}" will make it eligible for student scheduling during its permitted window. Ensure all questions are finalized.`
              : `Unpublishing "${modalState.exam?.title}" will revert it to draft status, preventing students from starting it.`
          }
          confirmText={
            modalState.type === 'delete'
              ? 'Delete Exam'
              : modalState.type === 'publish'
              ? 'Publish Now'
              : 'Revert to Draft'
          }
          confirmVariant={
            modalState.type === 'delete'
              ? 'danger'
              : modalState.type === 'publish'
              ? 'primary'
              : 'warning'
          }
          loading={modalState.loading}
          onConfirm={handleConfirmAction}
          onClose={handleCloseModal}
        />
      </div>
    </DashboardLayout>
  );
};

export default ExamList;
