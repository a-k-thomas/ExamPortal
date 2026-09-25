import React from 'react';

const StatCard = ({
  title,
  label,
  value,
  subtitle,
  caption,
  icon: Icon,
  variant = 'emerald', // 'emerald' | 'gold' | 'neutral'
  className = '',
}) => {
  const displayTitle = title || label;
  const displaySubtitle = subtitle || caption;

  const variantStyles = {
    emerald: {
      card: 'border-emerald-200/80 dark:border-emerald-800/40 hover:border-emerald-300 dark:hover:border-emerald-700/60',
      iconBox: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60',
      accentGlow: 'before:bg-emerald-600',
    },
    gold: {
      card: 'border-amber-200/80 dark:border-amber-800/40 hover:border-amber-300 dark:hover:border-amber-700/60',
      iconBox: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60',
      accentGlow: 'before:bg-amber-500',
    },
    neutral: {
      card: 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700',
      iconBox: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700',
      accentGlow: 'before:bg-stone-400',
    },
  };

  const current = variantStyles[variant] || variantStyles.emerald;

  return (
    <div
      className={`relative overflow-hidden bg-white dark:bg-[#112019] rounded-xl p-5 border shadow-2xs transition-all duration-200 ${current.card} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          {displayTitle && (
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {displayTitle}
            </p>
          )}
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight font-mono">
            {value}
          </p>
          {displaySubtitle && (
            <p className="text-xs text-stone-500 dark:text-stone-400 pt-0.5">
              {displaySubtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${current.iconBox}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
