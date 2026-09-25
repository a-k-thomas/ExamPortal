import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, FileText, AlertCircle, ArrowLeft } from 'lucide-react';

const formatForInput = (dateValue) => {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return '';
  // format YYYY-MM-DDTHH:mm
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const ExamForm = ({
  initialData = null,
  onSubmit,
  loading = false,
  backRoute = '/teacher/exams',
  isEdit = false,
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    duration: 60,
    startTime: '',
    endTime: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        instructions: initialData.instructions || '',
        duration: initialData.duration || 60,
        startTime: formatForInput(initialData.startTime),
        endTime: formatForInput(initialData.endTime),
      });
    } else {
      // Default dates: start now + 1 hour, end now + 25 hours
      const now = new Date();
      const start = new Date(now.getTime() + 60 * 60 * 1000);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      setFormData((prev) => ({
        ...prev,
        startTime: formatForInput(start),
        endTime: formatForInput(end),
      }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const { title, description, instructions, duration, startTime, endTime } = formData;

    if (!title.trim()) {
      return setError('Exam title is required.');
    }

    const numDuration = Number(duration);
    if (isNaN(numDuration) || numDuration <= 0) {
      return setError('Duration must be a positive number of minutes.');
    }

    if (!startTime || !endTime) {
      return setError('Both start time and end time are required.');
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return setError('Please provide valid date and time values.');
    }

    if (endDate <= startDate) {
      return setError('Permitted exam end time must be after the start time.');
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      duration: numDuration,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <div>
        <button
          type="button"
          onClick={() => navigate(backRoute)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Exams
        </button>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="border-b border-stone-200 dark:border-stone-800 pb-5 mb-6">
          <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100 tracking-tight">
            {isEdit ? 'Edit Exam Details' : 'Create New Examination'}
          </h2>
          <p className="text-stone-500 dark:text-stone-400 text-xs mt-1">
            Configure examination schedule, time limit, and examinee instructions.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-medium shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Overview & Instructions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-200 dark:border-stone-800">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                Assessment Overview & Instructions
              </h3>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Exam Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Data Structures & Algorithms Mid-Term"
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Description <span className="text-[11px] text-stone-400 font-normal lowercase">(optional)</span>
              </label>
              <textarea
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief summary of syllabus or coverage..."
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Student Instructions <span className="text-[11px] text-stone-400 font-normal lowercase">(optional)</span>
              </label>
              <textarea
                name="instructions"
                rows={3}
                value={formData.instructions}
                onChange={handleChange}
                placeholder="Instructions displayed to students before starting (e.g. No tab switching, answer all questions)..."
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                These instructions will be displayed on the student pre-exam briefing card.
              </span>
            </div>
          </div>

          {/* Section 2: Duration & Scheduling */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-200 dark:border-stone-800">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                Duration & Availability Window
              </h3>
            </div>

            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              <strong>How exam timing works:</strong> Students may start their test anytime between the permitted start and end dates. Once started, their personal countdown will run for the specified test duration.
            </div>

            {/* Duration & Scheduling Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Duration (Minutes) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    name="duration"
                    min="1"
                    max="1440"
                    required
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono transition"
                  />
                </div>
                <span className="text-[11px] text-stone-400 mt-1 block">Test time limit once begun</span>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Permitted Start <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    name="startTime"
                    required
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
                <span className="text-[11px] text-stone-400 mt-1 block">Earliest candidate access</span>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Permitted End <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    name="endTime"
                    required
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
                <span className="text-[11px] text-stone-400 mt-1 block">Window closure deadline</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => navigate(backRoute)}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isEdit ? (
                'Save Changes'
              ) : (
                'Create Exam & Add Questions'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamForm;
