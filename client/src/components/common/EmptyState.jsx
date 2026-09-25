import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const EmptyState = ({
  icon: Icon = BookOpen,
  title = 'No items found',
  description = 'There are no records to display at this time.',
  action,
  actionLabel,
  actionLink,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-dashed border-stone-300 dark:border-emerald-900/60 bg-white/50 dark:bg-[#112019]/50 p-8 sm:p-12 text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-13 h-13 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center mb-3.5 shadow-2xs">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mb-5">
        {description}
      </p>
      {action ? (
        <div>{action}</div>
      ) : actionLabel && actionLink ? (
        <div>
          <Link
            to={actionLink}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
};

export default EmptyState;
