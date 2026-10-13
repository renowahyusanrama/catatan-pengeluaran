interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="tnum text-xl font-semibold tracking-tight text-ink">{value}</span>
      {hint && <span className="text-sm text-ink-muted">{hint}</span>}
    </div>
  );
}