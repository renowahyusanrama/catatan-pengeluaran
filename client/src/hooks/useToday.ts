import { useEffect, useState } from 'react';
import { todayISO } from '../lib/dates';

// Mengembalikan tanggal hari ini (Asia/Jakarta) dan otomatis
// memperbarui saat melewati tengah malam.
export function useToday(): string {
  const [today, setToday] = useState<string>(() => todayISO());

  useEffect(() => {
    let timer: number;

    const schedule = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 1000);
      const delay = next.getTime() - now.getTime();
      timer = window.setTimeout(() => {
        setToday(todayISO());
        schedule();
      }, Math.min(delay, 60_000));
    };

    schedule();
    return () => window.clearTimeout(timer);
  }, []);

  return today;
}