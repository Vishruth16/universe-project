/**
 * Enterprise-grade date/time utilities.
 *
 * All backend timestamps arrive as ISO 8601 UTC strings (e.g. "2026-02-17T14:30:00.000000Z").
 * These helpers convert them to the user's local timezone and provide consistent formatting
 * across the entire application.
 */

// ─── Core parser ────────────────────────────────────────────────────────────

/** Parse an ISO string into a Date. Returns null for falsy/invalid input. */
export const parseDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

// ─── Relative time ("time ago") ─────────────────────────────────────────────

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Compact relative time — used in tight spaces like badges and list items.
 * Examples: "now", "3m", "2h", "5d", "3w", "2mo", "1y"
 */
export const timeAgoShort = (dateStr: string | null | undefined): string => {
  const date = parseDate(dateStr);
  if (!date) return '';
  const diff = Date.now() - date.getTime();
  if (diff < MINUTE) return 'now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  if (diff < WEEK) return `${Math.floor(diff / DAY)}d`;
  if (diff < MONTH) return `${Math.floor(diff / WEEK)}w`;
  if (diff < YEAR) return `${Math.floor(diff / MONTH)}mo`;
  return `${Math.floor(diff / YEAR)}y`;
};

/**
 * Verbose relative time — used in notification dropdowns, tooltips.
 * Examples: "just now", "3 minutes ago", "2 hours ago", "5 days ago"
 */
export const timeAgoLong = (dateStr: string | null | undefined): string => {
  const date = parseDate(dateStr);
  if (!date) return '';
  const diff = Date.now() - date.getTime();
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE);
    return `${m} minute${m !== 1 ? 's' : ''} ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} hour${h !== 1 ? 's' : ''} ago`;
  }
  if (diff < WEEK) {
    const d = Math.floor(diff / DAY);
    return `${d} day${d !== 1 ? 's' : ''} ago`;
  }
  if (diff < MONTH) {
    const w = Math.floor(diff / WEEK);
    return `${w} week${w !== 1 ? 's' : ''} ago`;
  }
  if (diff < YEAR) {
    const mo = Math.floor(diff / MONTH);
    return `${mo} month${mo !== 1 ? 's' : ''} ago`;
  }
  const y = Math.floor(diff / YEAR);
  return `${y} year${y !== 1 ? 's' : ''} ago`;
};

// ─── Absolute formatters (user's local timezone) ────────────────────────────

const pad = (n: number) => n.toString().padStart(2, '0');

/**
 * Time only — "2:30 PM"
 */
export const formatTime = (dateStr: string | null | undefined): string => {
  const date = parseDate(dateStr);
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

/**
 * Short date — "Feb 17, 2026"
 */
export const formatDateShort = (dateStr: string | null | undefined): string => {
  const date = parseDate(dateStr);
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Full date-time — "Feb 17, 2026 at 2:30 PM"
 */
export const formatDateTime = (dateStr: string | null | undefined): string => {
  const date = parseDate(dateStr);
  if (!date) return '';
  return `${formatDateShort(dateStr)} at ${formatTime(dateStr)}`;
};

// ─── Smart formatter (auto-picks relative vs absolute) ──────────────────────

/**
 * Smart timestamp for lists, notifications, etc.
 *  - < 1 min  → "just now"
 *  - < 1 hour → "X minutes ago"
 *  - < 24 hrs → "X hours ago"
 *  - < 7 days → "X days ago"
 *  - Same year → "Feb 17"
 *  - Older     → "Feb 17, 2025"
 */
export const formatSmart = (dateStr: string | null | undefined): string => {
  const date = parseDate(dateStr);
  if (!date) return '';
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE);
    return `${m} minute${m !== 1 ? 's' : ''} ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} hour${h !== 1 ? 's' : ''} ago`;
  }
  if (diff < WEEK) {
    const d = Math.floor(diff / DAY);
    return `${d} day${d !== 1 ? 's' : ''} ago`;
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return formatDateShort(dateStr);
};

/**
 * Chat message timestamp.
 *  - Today     → "2:30 PM"
 *  - Yesterday → "Yesterday 2:30 PM"
 *  - This week → "Mon 2:30 PM"
 *  - Older     → "Feb 17, 2:30 PM"
 */
export const formatChatTime = (dateStr: string | null | undefined): string => {
  const date = parseDate(dateStr);
  if (!date) return '';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const time = formatTime(dateStr);

  if (diff < DAY && date.getDate() === now.getDate()) {
    return time;
  }
  if (diff < 2 * DAY && date.getDate() === now.getDate() - 1) {
    return `Yesterday ${time}`;
  }
  if (diff < WEEK) {
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${day} ${time}`;
  }
  const short = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${short}, ${time}`;
};
