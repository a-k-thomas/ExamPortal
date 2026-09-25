/**
 * Attempt Timing Service — Phase 5B
 *
 * Provides authoritative server-side deadline calculations for exam attempts.
 * All time decisions rely on server-provided Date objects.
 * `now` is injectable in every exported function so tests can use deterministic
 * timestamps instead of real wall-clock time.
 *
 * Deadline rule:
 *   deadline = min(
 *     attempt.startedAt + exam.duration (minutes),
 *     exam.endTime
 *   )
 *
 * A 15-second network grace buffer is applied in `isAttemptExpired` so that
 * legitimate in-flight requests arriving just after the deadline are not rejected.
 * Callers that need strict enforcement (no grace) may pass graceMs = 0.
 */

/** Network-transmission grace window in milliseconds. */
export const DEFAULT_GRACE_MS = 15_000;

/**
 * Calculate the authoritative deadline for an exam attempt.
 *
 * @param {Object} attempt  - ExamAttempt document (must have `startedAt`)
 * @param {Object} exam     - Exam document (must have `duration` and `endTime`)
 * @returns {Date}          - The effective deadline
 */
export const calculateAttemptDeadline = (attempt, exam) => {
  const durationMs = (exam.duration || 0) * 60 * 1000;
  const timerEnd = new Date(attempt.startedAt).getTime() + durationMs;
  const examEnd = new Date(exam.endTime).getTime();
  return new Date(Math.min(timerEnd, examEnd));
};

/**
 * Determine whether an attempt has expired relative to a given timestamp.
 *
 * @param {Object} attempt  - ExamAttempt document
 * @param {Object} exam     - Exam document
 * @param {Date}   now      - Current time (injectable for deterministic tests)
 * @param {number} [graceMs=DEFAULT_GRACE_MS] - Network grace buffer in ms
 * @returns {boolean}       - true when the attempt is past its deadline + grace
 */
export const isAttemptExpired = (attempt, exam, now, graceMs = DEFAULT_GRACE_MS) => {
  const deadline = calculateAttemptDeadline(attempt, exam);
  return now.getTime() > deadline.getTime() + graceMs;
};

export default {
  calculateAttemptDeadline,
  isAttemptExpired,
  DEFAULT_GRACE_MS,
};
