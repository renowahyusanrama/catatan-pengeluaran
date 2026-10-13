import type { Transaction } from './types';

function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function transactionsToCSV(txs: Transaction[]): string {
  const header = ['Tanggal', 'Deskripsi', 'Kategori', 'Nominal', 'Catatan'];
  const rows = txs.map((t) => [
    t.date,
    t.description,
    t.category,
    String(t.amount),
    t.note,
  ]);
  const lines = [header, ...rows].map((row) => row.map(csvEscape).join(','));
  return lines.join('\r\n');
}

export function downloadCSV(filename: string, content: string): void {
  // BOM agar Excel membaca karakter UTF-8 dengan benar
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}