export const CATEGORIES = [
  'Makanan & Minuman',
  'Transportasi',
  'Kebutuhan Harian',
  'Tagihan',
  'Hiburan',
  'Belanja',
  'Kesehatan',
  'Lainnya',
] as const;

export type Category = (typeof CATEGORIES)[number];

// Warna untuk kategori pada grafik. Sengaja dijaga lembut & tidak mencolok.
export const CATEGORY_COLORS: Record<string, string> = {
  'Makanan & Minuman': '#23a466',
  Transportasi: '#5b8def',
  'Kebutuhan Harian': '#b7791f',
  Tagihan: '#d26464',
  Hiburan: '#8a63d2',
  Belanja: '#d98c2f',
  Kesehatan: '#2fb3a8',
  Lainnya: '#9aa0a6',
};

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#9aa0a6';
}

export function isKnownCategory(category: string): boolean {
  return (CATEGORIES as readonly string[]).includes(category);
}