/**
 * Shown when the app cannot reach its database. It says what is missing and
 * how to fix it — it never substitutes sample numbers for real ones.
 */
export function SetupNotice({ message }: { message: string }) {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-24">
      <p className="eyebrow">Your direct bookings</p>
      <h1 className="spoken mt-3 text-[32px] text-ink">
        This dashboard is not connected to its database yet
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">{message}</p>
      <ol className="mt-6 space-y-2 text-sm text-ink-soft">
        <li>
          1. Copy <code className="text-ink">.env.example</code> to{" "}
          <code className="text-ink">.env.local</code> and fill in your Supabase
          project URL and publishable key.
        </li>
        <li>
          2. Apply <code className="text-ink">supabase/migrations</code> to the project.
        </li>
        <li>
          3. Run <code className="text-ink">npm run seed</code>, then{" "}
          <code className="text-ink">npm run seed:verify</code>.
        </li>
      </ol>
    </main>
  );
}
