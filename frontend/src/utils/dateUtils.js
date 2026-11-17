/**
 * Date utilities aligned with Asia/Kolkata business reporting timezone
 */

export function formatDateTime(dateInput) {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatTime(dateInput) {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatDate(dateInput) {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getTodayKolkataDateString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()).replace(/-/g, '');
}

/**
 * Returns YYYY-MM-DD in Asia/Kolkata for comparison
 */
export function getKolkataDateOnlyString(dateInput = new Date()) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function isTodayKolkata(dateInput) {
  if (!dateInput) return false;
  return getKolkataDateOnlyString(dateInput) === getKolkataDateOnlyString(new Date());
}

export function isYesterdayKolkata(dateInput) {
  if (!dateInput) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getKolkataDateOnlyString(dateInput) === getKolkataDateOnlyString(yesterday);
}

export function isWithinDaysKolkata(dateInput, days = 7) {
  if (!dateInput) return false;
  const target = new Date(dateInput).getTime();
  const cutoff = new Date().getTime() - days * 24 * 60 * 60 * 1000;
  return target >= cutoff;
}

