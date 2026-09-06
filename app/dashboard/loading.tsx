/** Skeleton matching the real layout, so nothing jumps when data lands. */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="border-b border-rule/70">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-9 sm:px-10">
          <div className="h-4 w-24 rounded bg-surface-sunk" />
          <div className="mt-7 h-8 w-72 rounded bg-surface-sunk" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1200px] px-6 py-9 sm:px-10 sm:py-11">
        <div className="card h-[440px]" />
        <div className="mt-16 h-[460px] rounded-xl bg-surface-sunk/60" />
        <div className="mt-16 grid gap-14 lg:grid-cols-2">
          <div className="h-40 rounded-xl bg-surface-sunk/60" />
          <div className="h-40 rounded-xl bg-surface-sunk/60" />
        </div>
      </div>
    </div>
  );
}
