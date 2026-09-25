import React from 'react';
import { AlertTriangle, AlertCircle, HelpCircle, X } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  title,
  message,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'primary'
  onConfirm,
  onClose,
  loading = false,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      btn: 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500 text-white shadow-sm',
      icon: <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      iconBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50',
    },
    warning: {
      btn: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500 text-white shadow-sm',
      icon: <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      iconBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50',
    },
    primary: {
      btn: 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500 text-white shadow-sm',
      icon: <HelpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50',
    },
  };

  const style = variantStyles[confirmVariant] || variantStyles.primary;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${style.iconBg} shrink-0`}>
              {style.icon}
            </div>
            <h3 id="modal-title" className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-emerald-950/40 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {children ? (
          <div>{children}</div>
        ) : (
          <p className="text-stone-600 dark:text-stone-300 text-xs sm:text-sm leading-relaxed">
            {message}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-emerald-950/60">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${style.btn}`}
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
