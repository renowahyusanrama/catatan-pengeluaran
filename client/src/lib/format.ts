export function formatIDR(n: number): string {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? '-' : '';
  return sign + 'Rp' + new Intl.NumberFormat('id-ID').format(Math.abs(rounded));
}

// Mengubah angka menjadi digit murni (membuang semua selain digit)
export function parseNumeric(value: string): string {
  return value.replace(/[^\d]/g, '');
}

export function formatInputIDR(digits: string): string {
  if (digits === '') return '';
  const n = parseInt(digits, 10);
  if (Number.isNaN(n)) return '';
  return new Intl.NumberFormat('id-ID').format(n);
}

export function formatCompactIDR(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    const v = n / 1_000_000;
    return `Rp${v.toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  }
  if (Math.abs(n) >= 1_000) {
    const v = n / 1_000;
    return `Rp${v.toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`;
  }
  return formatIDR(n);
}