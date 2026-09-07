/**
 * A plain-English definition for a term the owner did not ask to learn.
 *
 * It supports a label that already makes sense on its own — it is never the
 * thing that makes a label make sense. Hover or keyboard focus reveals it, and
 * screen readers and touch users get the full text from the button's own
 * accessible name rather than from the panel.
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
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-[min(15rem,70vw)] -translate-x-1/2 rounded-lg border border-rule bg-surface px-3 py-2 text-left text-xs font-normal normal-case leading-snug tracking-normal text-ink-soft opacity-0 shadow-[0_8px_24px_rgba(34,40,43,0.10)] transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
