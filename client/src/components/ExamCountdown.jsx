import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, ShieldOff, CheckCircle2 } from 'lucide-react';

/**
 * ExamCountdown — Phase 5C & Redesign
 *
 * UX-only countdown derived from the server-provided `deadline` Date.
 * The server remains the single authority for enforcement.
 *
 * Props:
 *   deadline    {string|Date}  — ISO timestamp from the server-provided attempt.deadline
 *   onExpire    {Function}     — called exactly once when remaining time reaches zero
 *   disabled    {boolean}      — when true, shows "Submitted" state rather than ticking timer
 */
const ExamCountdown = ({ deadline, onExpire, disabled = false, className = '' }) => {
  const [remainingSecs, setRemainingSecs] = useState(null);
  const expiredCallbackFired = useRef(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (disabled || !deadline) return;

    const computeRemaining = () => {
      const diff = Math.floor((new Date(deadline).getTime() - Date.now()) / 1000);
      return Math.max(0, diff);
    };

    setRemainingSecs(computeRemaining());

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const secs = computeRemaining();
      setRemainingSecs(secs);

      if (secs <= 0 && !expiredCallbackFired.current) {
        expiredCallbackFired.current = true;
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        onExpire?.();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [deadline, disabled, onExpire]);

  const formatTime = (totalSecs) => {
    if (totalSecs == null || totalSecs < 0) totalSecs = 0;
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  if (disabled) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700 ${className}`}>
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span>Submitted</span>
      </div>
    );
  }

  if (remainingSecs === null) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-500 border border-stone-200 dark:border-emerald-950 bg-stone-100 dark:bg-[#112019] ${className}`}>
        <Clock className="w-4 h-4 animate-pulse text-stone-400" />
        <span className="font-mono">--:--</span>
      </div>
    );
  }

  if (remainingSecs <= 0) {
    return (
      <div
        role="status"
        aria-live="assertive"
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 ${className}`}
      >
        <ShieldOff className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        <span>Time Expired</span>
      </div>
    );
  }

  // Critical: ≤ 60 seconds
  if (remainingSecs <= 60) {
    return (
      <div
        role="timer"
        aria-live="polite"
        aria-label={`${formatTime(remainingSecs)} remaining — critical`}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-100 text-rose-900 border border-rose-400 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800 animate-pulse shadow-xs ${className}`}
      >
        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
        <span className="font-mono tracking-widest text-sm">{formatTime(remainingSecs)}</span>
      </div>
    );
  }

  // Warning: ≤ 300 seconds (5 minutes)
  if (remainingSecs <= 300) {
    return (
      <div
        role="timer"
        aria-live="polite"
        aria-label={`${formatTime(remainingSecs)} remaining — warning`}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700/80 shadow-xs ${className}`}
      >
        <Clock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="font-mono tracking-widest text-sm">{formatTime(remainingSecs)}</span>
      </div>
    );
  }

  // Normal: Emerald Academic Timer
  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`${formatTime(remainingSecs)} remaining`}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300/90 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700/80 shadow-2xs ${className}`}
    >
      <Clock className="w-4 h-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
      <span className="font-mono tracking-widest text-sm">{formatTime(remainingSecs)}</span>
    </div>
  );
};

export default ExamCountdown;
