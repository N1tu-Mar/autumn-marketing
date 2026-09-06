/**
 * Plain-English definition for a term the owner did not ask to learn.
 * Hover or focus reveals it; screen readers get it through the button label.
 */
export function HelpTip({ label, text }: { label: string; text: string }) {
  return (
    <span className="relative inline-flex group align-middle">
      <button
        type="button"
        aria-label={`What ${label} means: ${text}`}
        className="ml-1 grid h-[15px] w-[15px] place-items-center rounded-full border border-rule-strong text-[10px] font-semibold leading-none text-ink-faint transition-colors hover:border-harbor hover:text-harbor"
      >
        ?
      </button>
      <span
        role="presentation"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg border border-rule bg-surface px-3 py-2 text-xs leading-snug text-ink-soft opacity-0 shadow-[0_8px_24px_rgba(34,40,43,0.10)] transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
