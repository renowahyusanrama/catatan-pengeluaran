export const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
export const DAY_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

interface YMD {
  year: number;
  month: number;
  day: number;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function jakartaParts(date: Date = new Date()): YMD {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  let year = 0;
  let month = 0;
  let day = 0;
  for (const p of parts) {
    if (p.type === 'year') year = Number(p.value);
    else if (p.type === 'month') month = Number(p.value);
    else if (p.type === 'day') day = Number(p.value);
  }
  return { year, month, day };
}

export function todayISO(): string {
  const p = jakartaParts();
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

export function currentMonth(): string {
  const p = jakartaParts();
  return `${p.year}-${pad2(p.month)}`;
}

export function currentYear(): number {
  return jakartaParts().year;
}

// 0 = Minggu .. 6 = Sabtu (berdasarkan tanggal kalender, bukan zona waktu)
export function dayOfWeekISO(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// Indeks Senin=0 .. Minggu=6
export function weekdayIndex(iso: string): number {
  return (dayOfWeekISO(iso) + 6) % 7;
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

export function startOfWeekISO(iso: string): string {
  const diff = weekdayIndex(iso);
  return addDaysISO(iso, -diff);
}

export function endOfWeekISO(iso: string): string {
  return addDaysISO(startOfWeekISO(iso), 6);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function monthRangeISO(month: string): { start: string; end: string } {
  const [y, m] = month.split('-').map(Number);
  return {
    start: `${month}-01`,
    end: `${month}-${pad2(daysInMonth(y, m))}`,
  };
}

export function addMonthsISO(month: string, n: number): string {
  let [y, m] = month.split('-').map(Number);
  m += n;
  y += Math.floor((m - 1) / 12);
  m = ((m - 1) % 12 + 12) % 12 + 1;
  return `${y}-${pad2(m)}`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export function monthLabelShort(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTH_SHORT[m - 1]} ${y}`;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_SHORT[m - 1]} ${y}`;
}

export function formatDateFull(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

export function formatDayShort(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_SHORT[m - 1]}`;
}

export function weekdayName(iso: string): string {
  return DAY_NAMES[weekdayIndex(iso)];
}