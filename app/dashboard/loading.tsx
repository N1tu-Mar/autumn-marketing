/** Skeleton that matches the real layout, so nothing jumps when data lands. */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="border-b border-rule bg-surface">
        <div className="mx-auto w-full max-w-[1180px] px-5 py-8 sm:px-8">
          <div className="h-4 w-20 rounded bg-surface-sunk" />
          <div className="mt-6 h-8 w-72 rounded bg-surface-sunk" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1180px] space-y-6 px-5 py-7 sm:px-8">
        <div className="card h-[360px]" />
        <div className="card h-[420px]" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card h-[260px]" />
          <div className="card h-[260px]" />
        </div>
      </div>
    </div>
  );
}
