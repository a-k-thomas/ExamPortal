import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import ExamForm from '../../components/ExamForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getExamById, updateExam } from '../../services/examService';
import { AlertCircle } from 'lucide-react';

const ExamEdit = ({ basePath = '/teacher/exams' }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExam = async () => {
      setFetchLoading(true);
      setError('');
      try {
        const res = await getExamById(id);
        setExam(res.exam);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load exam details.');
      } finally {
        setFetchLoading(false);
      }
    };
    fetchExam();
  }, [id]);

  const handleUpdate = async (examPayload) => {
    setSubmitLoading(true);
    setError('');
    try {
      await updateExam(id, examPayload);
      navigate(`${basePath}/${id}`, {
        state: { flashMessage: 'Exam details updated successfully.' },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update exam.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {error && (
          <div className="max-w-3xl mx-auto p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {fetchLoading ? (
          <div className="max-w-3xl mx-auto p-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm">
            <LoadingSpinner message="Loading exam details..." />
          </div>
        ) : exam ? (
          <ExamForm
            initialData={exam}
            onSubmit={handleUpdate}
            loading={submitLoading}
            backRoute={`${basePath}/${id}`}
            isEdit={true}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default ExamEdit;
