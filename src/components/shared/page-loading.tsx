export function PageLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading page"
      className="page-loading animate-pulse space-y-6"
      role="status"
    >
      <span className="sr-only">Loading…</span>
      <div className="space-y-3">
        <div className="h-3 w-36 rounded bg-[#E4E0D4]" />
        <div className="h-9 w-64 rounded bg-[#E4E0D4]" />
        <div className="h-4 w-96 max-w-full rounded bg-[#E4E0D4]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: rows }, (_, index) => (
          <div className="h-28 rounded-[14px] bg-[#E4E0D4]" key={index} />
        ))}
      </div>
    </div>
  );
}
