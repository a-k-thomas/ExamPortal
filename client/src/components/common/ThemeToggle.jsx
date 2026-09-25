import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ className = '', showLabel = false, size = 'md' }) => {
  const { theme, isDark, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-2.5 text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-200 border cursor-pointer
        ${isDark
          ? 'bg-emerald-950/40 text-amber-300 hover:text-amber-200 hover:bg-emerald-900/50 border-emerald-800/60 shadow-sm'
          : 'bg-stone-100 text-emerald-800 hover:text-emerald-950 hover:bg-stone-200 border-stone-200 shadow-xs'
        }
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun className={`${iconSizes[size] || iconSizes.md} text-amber-400 animate-pulse-subtle`} />
      ) : (
        <Moon className={`${iconSizes[size] || iconSizes.md} text-emerald-700`} />
      )}
      {showLabel && (
        <span className="text-xs font-semibold tracking-wide">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
