/**
 * Date formatting and Discord timestamp utility
 */

export function getTodayString(): string {
  const d = new Date();
  return formatDateToISO(d);
}

export function formatDateToISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(isoString: string): Date {
  const [y, m, d] = isoString.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Calculates unix timestamp (seconds) for the given date at specified shift time (default 20:30)
 */
export function getDiscordUnixTimestamp(dateIso: string, timeStr = '20:30'): number {
  const [year, month, day] = dateIso.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const dt = new Date(year, month - 1, day, hours || 20, minutes || 30, 0, 0);
  return Math.floor(dt.getTime() / 1000);
}

/**
 * Format e.g. "August 29, 2026 8:30 PM" (as shown in user image)
 */
export function formatReadableDateTime(dateIso: string, timeStr = '20:30'): string {
  const [year, month, day] = dateIso.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const dt = new Date(year, month - 1, day, hours || 20, minutes || 30);
  
  return dt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Indonesian style readable date: "29 Agustus 2026, 20:30"
 */
export function formatIndonesianDateTime(dateIso: string, timeStr = '20:30'): string {
  const [year, month, day] = dateIso.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const dt = new Date(year, month - 1, day, hours || 20, minutes || 30);

  return dt.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function addDays(dateIso: string, days: number): string {
  const dt = parseISODate(dateIso);
  dt.setDate(dt.getDate() + days);
  return formatDateToISO(dt);
}

export function getLastNDays(n: number, endDateIso?: string): string[] {
  const end = endDateIso ? parseISODate(endDateIso) : new Date();
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    dates.push(formatDateToISO(d));
  }
  return dates;
}

export function formatShortDate(dateIso: string): string {
  const dt = parseISODate(dateIso);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
