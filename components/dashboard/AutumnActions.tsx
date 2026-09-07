import { Band } from "@/components/ui/Band";
import { shortDate } from "@/lib/analytics/format";
import type { AutumnAction } from "@/types/database";

/**
 * An update from the team, written as a note rather than rendered as a status
 * component. The point is the feeling that someone competent is looking after
 * this, which badges actively work against.
 */

const STATUS_COPY: Record<AutumnAction["status"], string> = {
  active: "Running now",
  monitoring: "Watching results",
  completed: "Done",
};

export function AutumnActions({
  actions,
  timezone,
}: {
  actions: AutumnAction[];
  timezone: string;
}) {
  return (
    <Band title="From your Autumn team">
      {actions.length === 0 ? (
        <p className="max-w-prose text-[15px] leading-relaxed text-ink-soft">
          Autumn has not recorded any changes to your marketing up to the end of
          this period.
        </p>
      ) : (
        <ol className="max-w-prose space-y-7">
          {actions.map((action) => (
            <li key={action.id}>
              <h3 className="text-[16px] font-semibold leading-snug text-ink">
                {action.title}
              </h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">
                {action.description}
              </p>
              <p className="mt-2 text-[13px] text-ink-faint">
                {STATUS_COPY[action.status]} · {shortDate(action.action_date, timezone)}
              </p>
            </li>
          ))}
        </ol>
      )}

      {/* The most useful sentence in the section, and the easiest to forget. */}
      <p className="mt-8 max-w-prose border-t border-rule/60 pt-5 text-[14px] leading-relaxed text-ink-soft">
        Autumn runs this work for you. No action needed from you.
      </p>
    </Band>
  );
}
