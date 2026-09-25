import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import ExamForm from '../../components/ExamForm';
import { createExam } from '../../services/examService';

const ExamCreate = ({ basePath = '/teacher/exams' }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleCreate = async (examPayload) => {
    setLoading(true);
    setApiError('');
    try {
      const res = await createExam(examPayload);
      // Navigate to the newly created exam detail page to add questions
      navigate(`${basePath}/${res.exam._id}`, {
        state: { flashMessage: 'Exam created successfully! Now add questions below.' },
      });
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to create exam.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {apiError && (
          <div className="max-w-3xl mx-auto p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-medium shadow-sm">
            {apiError}
          </div>
        )}
        <ExamForm
          onSubmit={handleCreate}
          loading={loading}
          backRoute={basePath}
          isEdit={false}
        />
      </div>
    </DashboardLayout>
  );
};

export default ExamCreate;
