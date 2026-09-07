/**
 * A plain-English definition for a term the owner did not ask to learn.
 *
 * It supports a label that already makes sense on its own — it is never the
 * thing that makes a label make sense. Hover or keyboard focus reveals it, and
 * screen readers and touch users get the full text from the button's own
 * accessible name rather than from the panel.
 *
 * The ring pulses once every eight seconds (see .help-pulse in globals.css) so
 * the affordance is discoverable without a permanent visual weight.
 *
 * The group is named. An unnamed one matches any ancestor carrying `group`,
 * which meant hovering the collapsible section around the campaign table
 * opened every tooltip in the header at once.
 *
 * Callers place the panel because only they know what would clip it: a header
 * cell at the top of a scrolling table has no room above it, and the last
 * column has none to its right.
 */
export function HelpTip({
  label,
  text,
  placement = "top",
  align = "center",
}: {
  label: string;
  text: string;
  placement?: "top" | "bottom";
  align?: "center" | "start" | "end";
}) {
  // Placement is a desktop concern: the table that needs it only renders at md
  // and up. On a phone no fixed anchor works, because the trigger lands wherever
  // the sentence happens to wrap — centred it hangs off the right, anchored
  // right it hangs off the left at 320. So below sm the panel is pinned to the
  // bottom of the viewport, where it always fits, and the anchored placement
  // starts at sm. The two sets never overlap, so neither can win by class order.
  const position = [
    "fixed inset-x-4 bottom-4 w-auto",
    "sm:absolute sm:inset-x-auto sm:w-[min(15rem,70vw)]",
    placement === "top" ? "sm:bottom-full sm:mb-2 sm:top-auto" : "sm:top-full sm:mt-2 sm:bottom-auto",
    align === "center"
      ? "sm:left-1/2 sm:-translate-x-1/2"
      : align === "start"
        ? "sm:left-0"
        : "sm:right-0",
  ].join(" ");

  return (
    <span className="group/tip relative inline-flex align-middle">
      <button
        type="button"
        aria-label={`What ${label} means: ${text}`}
        className="help-pulse ml-1 grid h-[15px] w-[15px] place-items-center rounded-full border border-rule-strong text-[10px] font-semibold leading-none text-ink-faint transition-colors hover:border-harbor hover:text-harbor"
      >
        ?
      </button>
      <span
        role="presentation"
        className={`pointer-events-none z-20 rounded-lg border border-rule bg-surface px-3 py-2 text-left text-xs font-normal normal-case leading-snug tracking-normal text-ink-soft opacity-0 shadow-[0_8px_24px_rgba(34,40,43,0.10)] transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 ${position}`}
      >
        {text}
      </span>
    </span>
  );
}
