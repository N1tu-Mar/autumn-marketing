"use client";

/**
 * What the owner sees when a query fails. It says what did not load and that
 * nothing is broken on their account — never the RPC name, never a stack, and
 * never a fallback number standing in for a real one.
 */
export function LoadFailure({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-24">
      <p className="eyebrow">Your direct bookings</p>
      <h1 className="spoken mt-3 text-[32px] text-ink">
        We couldn&apos;t load your booking performance right now
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">
        Your data is safe and nothing has changed on your account. Try again in a
        moment.
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
