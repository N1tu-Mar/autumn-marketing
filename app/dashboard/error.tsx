"use client";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-24">
      <p className="eyebrow">Marketing performance</p>
      <h1 className="spoken mt-3 text-[32px] text-ink">
        We couldn&apos;t load marketing performance right now
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">
        The connection to your reporting data failed. Nothing has changed on your
        account.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-harbor px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-harbor-deep"
      >
        Try again
      </button>
    </main>
  );
}
