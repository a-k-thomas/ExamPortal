/**
 * Academic Exam Filter & Search Utilities
 *
 * Provides standardized, client-side search, subject extraction,
 * availability status calculation, and sorting for examination listings.
 */

/**
 * Dynamically extract or derive the academic subject for an examination.
 * Honors explicit `subject` or `department` properties first, then parses
 * standardized course code prefixes from the title (e.g. CS301 -> Computer Science).
 */
export const getExamSubject = (exam) => {
  if (!exam) return 'General';
  if (exam.subject && typeof exam.subject === 'string' && exam.subject.trim()) {
    return exam.subject.trim();
  }
  if (exam.department && typeof exam.department === 'string' && exam.department.trim()) {
    return exam.department.trim();
  }
  if (exam.title && typeof exam.title === 'string') {
    const parts = exam.title.split(':');
    if (parts.length > 1) {
      const prefix = parts[0].trim();
      const codeMatch = prefix.match(/^([A-Za-z]{2,4})\s*\d*/);
      if (codeMatch) {
        const dept = codeMatch[1].toUpperCase();
        if (dept === 'CS' || dept === 'CSE') return 'Computer Science (CS)';
        if (dept === 'IT') return 'Information Technology (IT)';
        if (dept === 'EC' || dept === 'ECE') return 'Electronics & Comm (EC)';
        if (dept === 'EE' || dept === 'EEE') return 'Electrical Engineering (EE)';
        if (dept === 'ME') return 'Mechanical Engineering (ME)';
        if (dept === 'CE') return 'Civil Engineering (CE)';
        if (dept === 'MATH' || dept === 'MAT') return 'Mathematics';
        if (dept === 'PHYS' || dept === 'PHY') return 'Physics';
        if (dept === 'CHEM' || dept === 'CHM') return 'Chemistry';
      }
      return prefix;
    }
  }
  return 'General';
};

/**
 * Extract course code if present (e.g., "CS301", "IT304", "EC208")
 */
export const getExamCode = (exam) => {
  if (!exam) return '';
  if (exam.code && typeof exam.code === 'string') return exam.code.trim();
  if (exam.courseCode && typeof exam.courseCode === 'string') return exam.courseCode.trim();
  if (exam.title && typeof exam.title === 'string') {
    const match = exam.title.match(/^([A-Za-z0-9\-]+)\s*:/);
    if (match) return match[1].trim();
  }
  return '';
};

/**
 * Calculate the canonical exam availability and schedule status
 * using the application's authoritative business logic.
 */
export const getExamStatusCategory = (exam) => {
  const attempt = exam?.studentAttempt;
  const isSubmitted =
    attempt?.status === 'submitted' || attempt?.status === 'auto_submitted';
  const now = new Date();
  const startTime = exam?.startTime ? new Date(exam.startTime) : null;
  const endTime = exam?.endTime ? new Date(exam.endTime) : null;

  if (isSubmitted || (endTime && now > endTime)) {
    return 'CLOSED_COMPLETED';
  }
  if (startTime && now < startTime) {
    return 'UPCOMING';
  }
  return 'AVAILABLE_NOW';
};

/**
 * Case-insensitive, whitespace-tolerant multi-field search matcher
 */
export const matchesSearch = (exam, rawQuery) => {
  const q = (rawQuery || '').trim().toLowerCase();
  if (!q) return true;

  const title = (exam?.title || '').toLowerCase();
  const desc = (exam?.description || '').toLowerCase();
  const instructions = (exam?.instructions || '').toLowerCase();
  const subject = getExamSubject(exam).toLowerCase();
  const code = getExamCode(exam).toLowerCase();

  const combined = `${title} ${desc} ${instructions} ${subject} ${code}`;
  if (combined.includes(q)) return true;

  // Whitespace-tolerant match for codes like "CS 301" <-> "CS301"
  const qCompressed = q.replace(/\s+/g, '');
  const combinedCompressed = combined.replace(/\s+/g, '');
  if (qCompressed && combinedCompressed.includes(qCompressed)) return true;

  // Multi-term token matching (e.g. "Operating Systems CS305")
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    return tokens.every((token) => combined.includes(token));
  }

  return false;
};
