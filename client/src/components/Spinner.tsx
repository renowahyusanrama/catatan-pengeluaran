export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      className="animate-spin text-gray-400"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-gray-500">
      <Spinner size={28} />
      <p className="text-sm">Memuat data…</p>
    </div>
  );
}