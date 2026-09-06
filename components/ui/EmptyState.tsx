/** Says what is missing and what would change it. Never a fallback number. */
export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-rule-strong bg-surface-sunk px-5 py-8 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {detail ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-soft">{detail}</p>
      ) : null}
    </div>
  );
}
