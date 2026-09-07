/**
 * The detail screen opens on a bare figure rather than on a card, so it needs
 * its own skeleton. Inheriting the overview's would promise a large card that
 * never arrives, which is the jump a skeleton exists to prevent.
 */
export default function BookingsLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="border-b border-rule/70">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-9 sm:px-10">
          <div className="h-4 w-24 rounded bg-surface-sunk" />
          <div className="mt-7 h-8 w-72 rounded bg-surface-sunk" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1200px] px-6 py-10 sm:px-10 sm:py-12">
        <div className="h-14 w-64 rounded bg-surface-sunk" />
        <div className="mt-4 h-4 w-80 rounded bg-surface-sunk/60" />

        <div className="mt-16 h-64 rounded-xl bg-surface-sunk/60 sm:mt-20" />
        <div className="mt-16 h-64 rounded-xl bg-surface-sunk/60 sm:mt-20" />
        <div className="mt-16 h-56 max-w-2xl rounded-xl bg-surface-sunk/60 sm:mt-20" />
      </div>
    </div>
  );
}
