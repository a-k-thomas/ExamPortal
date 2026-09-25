import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2, AlertCircle, HelpCircle, CheckSquare, ListFilter, Type } from 'lucide-react';

const QUESTION_TYPE_CONFIG = {
  SINGLE_CHOICE: {
    label: 'Single Choice',
    description: 'Student selects exactly one correct option from a list of choices.',
    studentInstruction: 'Select one answer',
    icon: ListFilter,
  },
  MULTIPLE_SELECT: {
    label: 'Multiple Select',
    description: 'Student selects one or more options. Full marks awarded for exact set match.',
    studentInstruction: 'Select all that apply',
    icon: CheckSquare,
  },
  TRUE_FALSE: {
    label: 'True / False',
    description: 'Student evaluates whether the statement is True or False.',
    studentInstruction: 'Select one',
    icon: CheckCircle2,
  },
  SHORT_ANSWER: {
    label: 'Short Answer',
    description: 'Student enters a text response evaluated against accepted answers.',
    studentInstruction: 'Type your answer',
    icon: Type,
  },
};

const QuestionModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  defaultOrder = 1,
  loading = false,
}) => {
  const [questionType, setQuestionType] = useState('SINGLE_CHOICE');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
  const [correctAnswerIndices, setCorrectAnswerIndices] = useState([0]);
  const [tfCorrectAnswer, setTfCorrectAnswer] = useState('True');
  const [acceptedAnswers, setAcceptedAnswers] = useState(['']);
  const [explanation, setExplanation] = useState('');
  const [marks, setMarks] = useState(1);
  const [order, setOrder] = useState(defaultOrder);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      const qType = initialData.questionType || 'SINGLE_CHOICE';
      setQuestionType(qType);
      setQuestionText(initialData.questionText || '');
      setExplanation(initialData.explanation || '');
      setMarks(initialData.marks !== undefined ? initialData.marks : 1);
      setOrder(initialData.order !== undefined ? initialData.order : defaultOrder);

      const existingOptions =
        initialData.options && initialData.options.length >= 2
          ? initialData.options
          : ['', '', '', ''];
      setOptions(existingOptions);

      // Single choice setup
      const foundIdx = existingOptions.indexOf(initialData.correctAnswer);
      setCorrectAnswerIndex(foundIdx !== -1 ? foundIdx : 0);

      // Multiple select setup
      if (Array.isArray(initialData.correctAnswers) && initialData.correctAnswers.length > 0) {
        const indices = initialData.correctAnswers
          .map((ans) => existingOptions.indexOf(ans))
          .filter((idx) => idx !== -1);
        setCorrectAnswerIndices(indices.length > 0 ? indices : [0]);
      } else if (foundIdx !== -1) {
        setCorrectAnswerIndices([foundIdx]);
      } else {
        setCorrectAnswerIndices([0]);
      }

      // True/False setup
      if (initialData.correctAnswer) {
        const norm = String(initialData.correctAnswer).trim().toLowerCase();
        setTfCorrectAnswer(norm === 'false' ? 'False' : 'True');
      } else {
        setTfCorrectAnswer('True');
      }

      // Short answer setup
      if (Array.isArray(initialData.acceptedAnswers) && initialData.acceptedAnswers.length > 0) {
        setAcceptedAnswers(initialData.acceptedAnswers);
      } else if (initialData.correctAnswer) {
        setAcceptedAnswers([initialData.correctAnswer]);
      } else {
        setAcceptedAnswers(['']);
      }
    } else {
      setQuestionType('SINGLE_CHOICE');
      setQuestionText('');
      setExplanation('');
      setOptions(['', '', '', '']);
      setCorrectAnswerIndex(0);
      setCorrectAnswerIndices([0]);
      setTfCorrectAnswer('True');
      setAcceptedAnswers(['']);
      setMarks(1);
      setOrder(defaultOrder);
    }
    setError('');
  }, [initialData, defaultOrder, isOpen]);

  if (!isOpen) return null;

  // Options handlers
  const handleOptionChange = (idx, value) => {
    const updated = [...options];
    updated[idx] = value;
    setOptions(updated);
    if (error) setError('');
  };

  const handleAddOption = () => {
    if (options.length >= 8) {
      return setError('Maximum 8 options allowed.');
    }
    setOptions([...options, '']);
  };

  const handleRemoveOption = (idx) => {
    if (options.length <= 2) {
      return setError('At least 2 options are required.');
    }
    const updated = options.filter((_, i) => i !== idx);
    setOptions(updated);

    // Adjust single choice
    if (correctAnswerIndex === idx) {
      setCorrectAnswerIndex(0);
    } else if (correctAnswerIndex > idx) {
      setCorrectAnswerIndex(correctAnswerIndex - 1);
    }

    // Adjust multiple select
    const updatedMulti = correctAnswerIndices
      .filter((i) => i !== idx)
      .map((i) => (i > idx ? i - 1 : i));
    setCorrectAnswerIndices(updatedMulti.length > 0 ? updatedMulti : [0]);
  };

  const toggleMultiCorrect = (idx) => {
    if (correctAnswerIndices.includes(idx)) {
      if (correctAnswerIndices.length === 1) {
        return setError('At least one correct answer must remain selected.');
      }
      setCorrectAnswerIndices(correctAnswerIndices.filter((i) => i !== idx));
    } else {
      setCorrectAnswerIndices([...correctAnswerIndices, idx]);
    }
    if (error) setError('');
  };

  // Accepted answers handlers (short answer)
  const handleAcceptedAnswerChange = (idx, value) => {
    const updated = [...acceptedAnswers];
    updated[idx] = value;
    setAcceptedAnswers(updated);
    if (error) setError('');
  };

  const handleAddAcceptedAnswer = () => {
    if (acceptedAnswers.length >= 10) {
      return setError('Maximum 10 accepted answers allowed.');
    }
    setAcceptedAnswers([...acceptedAnswers, '']);
  };

  const handleRemoveAcceptedAnswer = (idx) => {
    if (acceptedAnswers.length <= 1) {
      return setError('At least 1 accepted answer is required.');
    }
    setAcceptedAnswers(acceptedAnswers.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!questionText.trim()) {
      return setError('Please enter the question text.');
    }

    const numMarks = Number(marks);
    if (isNaN(numMarks) || numMarks <= 0) {
      return setError('Marks must be a positive number.');
    }

    const numOrder = Number(order);
    if (isNaN(numOrder) || numOrder < 1) {
      return setError('Order must be a positive integer.');
    }

    // Validation per question type
    if (questionType === 'SINGLE_CHOICE') {
      const trimmedOptions = options.map((opt) => opt.trim());
      if (trimmedOptions.length < 2) {
        return setError('At least 2 options are required.');
      }
      const emptyIdx = trimmedOptions.findIndex((opt) => !opt);
      if (emptyIdx !== -1) {
        return setError(`Option ${String.fromCharCode(65 + emptyIdx)} cannot be empty.`);
      }
      const uniqueOptions = new Set(trimmedOptions);
      if (uniqueOptions.size !== trimmedOptions.length) {
        return setError('Each option must be distinct/unique.');
      }
      const chosenAnswer = trimmedOptions[correctAnswerIndex];
      if (!chosenAnswer) {
        return setError('Please select a valid correct answer.');
      }

      onSubmit({
        questionType: 'SINGLE_CHOICE',
        questionText: questionText.trim(),
        options: trimmedOptions,
        correctAnswer: chosenAnswer,
        explanation: explanation.trim(),
        marks: numMarks,
        order: numOrder,
      });
    } else if (questionType === 'MULTIPLE_SELECT') {
      const trimmedOptions = options.map((opt) => opt.trim());
      if (trimmedOptions.length < 2) {
        return setError('At least 2 options are required.');
      }
      const emptyIdx = trimmedOptions.findIndex((opt) => !opt);
      if (emptyIdx !== -1) {
        return setError(`Option ${String.fromCharCode(65 + emptyIdx)} cannot be empty.`);
      }
      const uniqueOptions = new Set(trimmedOptions);
      if (uniqueOptions.size !== trimmedOptions.length) {
        return setError('Each option must be distinct/unique.');
      }
      if (correctAnswerIndices.length === 0) {
        return setError('Please select at least one correct option.');
      }
      const chosenAnswers = correctAnswerIndices
        .map((idx) => trimmedOptions[idx])
        .filter(Boolean);

      onSubmit({
        questionType: 'MULTIPLE_SELECT',
        questionText: questionText.trim(),
        options: trimmedOptions,
        correctAnswers: chosenAnswers,
        correctAnswer: chosenAnswers[0] || '',
        explanation: explanation.trim(),
        marks: numMarks,
        order: numOrder,
      });
    } else if (questionType === 'TRUE_FALSE') {
      onSubmit({
        questionType: 'TRUE_FALSE',
        questionText: questionText.trim(),
        options: ['True', 'False'],
        correctAnswer: tfCorrectAnswer,
        explanation: explanation.trim(),
        marks: numMarks,
        order: numOrder,
      });
    } else if (questionType === 'SHORT_ANSWER') {
      const trimmedAccepted = acceptedAnswers.map((a) => a.trim()).filter(Boolean);
      if (trimmedAccepted.length === 0) {
        return setError('Please provide at least one accepted answer.');
      }

      onSubmit({
        questionType: 'SHORT_ANSWER',
        questionText: questionText.trim(),
        options: [],
        acceptedAnswers: trimmedAccepted,
        correctAnswer: trimmedAccepted[0] || '',
        explanation: explanation.trim(),
        marks: numMarks,
        order: numOrder,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 dark:bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 my-8 animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              {initialData ? 'Edit Question' : 'Add New Question'}
            </h3>
            <p className="text-stone-500 dark:text-stone-400 text-xs mt-0.5">
              {QUESTION_TYPE_CONFIG[questionType]?.description}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-medium shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Question Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Question Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(QUESTION_TYPE_CONFIG).map(([typeKey, cfg]) => {
                const Icon = cfg.icon;
                const isSelected = questionType === typeKey;
                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => {
                      setQuestionType(typeKey);
                      if (error) setError('');
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-2xs font-semibold'
                        : 'bg-stone-50 dark:bg-stone-950/50 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-stone-100 dark:hover:bg-stone-800/40'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`} />
                    <span className="text-xs font-medium">{cfg.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Student Experience Preview Banner */}
            <div className="mt-3 p-3 bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-stone-500 dark:text-stone-400 font-medium">Candidate Instruction:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                  "{QUESTION_TYPE_CONFIG[questionType]?.studentInstruction}"
                </span>
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                {QUESTION_TYPE_CONFIG[questionType]?.description}
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Question Statement <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={questionText}
              onChange={(e) => {
                setQuestionText(e.target.value);
                if (error) setError('');
              }}
              placeholder={
                questionType === 'SHORT_ANSWER'
                  ? 'e.g., What does CPU stand for?'
                  : questionType === 'TRUE_FALSE'
                  ? 'e.g., The Earth revolves around the Sun.'
                  : questionType === 'MULTIPLE_SELECT'
                  ? 'e.g., Which of the following are programming languages?'
                  : 'e.g., What is the capital of France?'
              }
              className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>

          {/* 1. SINGLE_CHOICE Options */}
          {questionType === 'SINGLE_CHOICE' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Options & Correct Answer <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-stone-400">
                  Select the radio button for the correct option
                </span>
              </div>

              <div className="space-y-2.5">
                {options.map((opt, idx) => {
                  const label = String.fromCharCode(65 + idx);
                  const isSelected = correctAnswerIndex === idx;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100'
                          : 'bg-stone-50 dark:bg-stone-950/50 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <input
                          type="radio"
                          name="singleChoiceAnswer"
                          checked={isSelected}
                          onChange={() => setCorrectAnswerIndex(idx)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-stone-300 dark:border-stone-700 cursor-pointer"
                        />
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          {label}
                        </span>
                      </label>

                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${label} text...`}
                        className="flex-1 bg-transparent border-0 px-2 py-1 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none"
                      />

                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                          title="Delete option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {options.length < 8 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/50 transition mt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Another Option
                </button>
              )}
            </div>
          )}

          {/* 2. MULTIPLE_SELECT Options */}
          {questionType === 'MULTIPLE_SELECT' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Options & Correct Answers <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-stone-400">
                  Check all options that are correct
                </span>
              </div>

              <div className="space-y-2.5">
                {options.map((opt, idx) => {
                  const label = String.fromCharCode(65 + idx);
                  const isChecked = correctAnswerIndices.includes(idx);

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${
                        isChecked
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100'
                          : 'bg-stone-50 dark:bg-stone-950/50 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleMultiCorrect(idx)}
                          className="w-4 h-4 text-emerald-600 rounded border-stone-300 dark:border-stone-700 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                            isChecked
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          {label}
                        </span>
                      </label>

                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${label} text...`}
                        className="flex-1 bg-transparent border-0 px-2 py-1 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none"
                      />

                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                          title="Delete option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {options.length < 8 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/50 transition mt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Another Option
                </button>
              )}
            </div>
          )}

          {/* 3. TRUE_FALSE Options */}
          {questionType === 'TRUE_FALSE' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Correct Answer <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['True', 'False'].map((val) => {
                  const isSelected = tfCorrectAnswer === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTfCorrectAnswer(val)}
                      className={`p-4 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                          : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-emerald-300'
                      }`}
                    >
                      <span className="text-sm">{val}</span>
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
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
              <p className="text-[11px] text-stone-400 dark:text-stone-500">
                Options are automatically configured as "True" and "False".
              </p>
            </div>
          )}

          {/* 4. SHORT_ANSWER Accepted Answers */}
          {questionType === 'SHORT_ANSWER' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Accepted Answers <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-stone-400">
                  Case-insensitive, whitespace normalized
                </span>
              </div>

              <div className="space-y-2.5">
                {acceptedAnswers.map((ans, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-xl border bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800"
                  >
                    <span className="w-6 h-6 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      required
                      value={ans}
                      onChange={(e) => handleAcceptedAnswerChange(idx, e.target.value)}
                      placeholder={idx === 0 ? 'e.g., Central Processing Unit' : 'Alternative, e.g., CPU'}
                      className="flex-1 bg-transparent border-0 px-2 py-1 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none"
                    />
                    {acceptedAnswers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAcceptedAnswer(idx)}
                        className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                        title="Delete accepted answer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {acceptedAnswers.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddAcceptedAnswer}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/50 transition mt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Another Accepted Answer
                </button>
              )}
            </div>
          )}

          {/* Explanation (Optional) */}
          <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Explanation <span className="font-normal text-stone-400 dark:text-stone-500 lowercase">(optional)</span>
              </label>
            </div>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain why the correct answer is correct. Students can see this after submitting the examination."
              className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition placeholder-stone-400 resize-y"
            />
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Explain why the correct answer is correct. Students can see this after submitting the examination.
            </p>
          </div>

          {/* Marks and Order Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-100 dark:border-stone-800">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Marks Awarded <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="100"
                required
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                className="w-full px-4 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Display Order <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="w-full px-4 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving Question...
                </>
              ) : initialData ? (
                'Update Question'
              ) : (
                'Add Question'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionModal;
