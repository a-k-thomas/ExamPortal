import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({
  title,
  subtitle,
  backTo,
  backLabel = 'Back',
  actions,
  badge,
  className = '',
}) => {
  const navigate = useNavigate();

  return (
    <div className={`mb-6 pb-5 border-b border-stone-200 dark:border-emerald-900/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
      <div className="space-y-1">
        {backTo && (
          <button
            type="button"
            onClick={() => (typeof backTo === 'string' ? navigate(backTo) : navigate(-1))}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLabel}</span>
          </button>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 font-serif">
            {title}
          </h1>
          {badge && (
            typeof badge === 'string' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-sans font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80">
                {badge}
              </span>
            ) : (
              <div>{badge}</div>
            )
          )}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-3xl">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
