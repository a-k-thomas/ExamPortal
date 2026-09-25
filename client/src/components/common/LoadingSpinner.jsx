import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ label, message, size = 'md', className = '' }) => {
  const displayLabel = message || label || 'Loading...';

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 gap-3 text-emerald-700 dark:text-emerald-400 ${className}`}>
      <Loader2 className={`${sizes[size] || sizes.md} animate-spin text-emerald-600 dark:text-emerald-400`} />
      {displayLabel && (
        <p className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400 animate-pulse">
          {displayLabel}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
