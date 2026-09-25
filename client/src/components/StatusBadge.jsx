import React from 'react';

const StatusBadge = ({ status, className = '' }) => {
  const configs = {
    // Exam states
    draft: {
      label: 'Draft',
      classes: 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800/60 dark:text-stone-300 dark:border-stone-700',
      dot: 'bg-stone-400',
    },
    published: {
      label: 'Published',
      classes: 'bg-emerald-50 text-emerald-800 border-emerald-300/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60',
      dot: 'bg-emerald-500 animate-pulse',
    },
    archived: {
      label: 'Archived',
      classes: 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-900/60 dark:text-stone-400 dark:border-stone-800',
      dot: 'bg-stone-400',
    },
    // Window states
    upcoming: {
      label: 'Upcoming',
      classes: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60',
      dot: 'bg-blue-500',
    },
    active: {
      label: 'Active Window',
      classes: 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700',
      dot: 'bg-emerald-500 animate-pulse',
    },
    closed: {
      label: 'Closed',
      classes: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/60',
      dot: 'bg-rose-500',
    },
    // Attempt states
    in_progress: {
      label: 'In Progress',
      classes: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/60',
      dot: 'bg-amber-500 animate-pulse',
    },
    submitted: {
      label: 'Submitted',
      classes: 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60',
      dot: 'bg-emerald-500',
    },
    auto_submitted: {
      label: 'Auto Submitted',
      classes: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60',
      dot: 'bg-amber-500',
    },
  };

  const key = (status || '').toLowerCase();
  const config = configs[key] || {
    label: status || 'Unknown',
    classes: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
    dot: 'bg-stone-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs tracking-wide ${config.classes} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
