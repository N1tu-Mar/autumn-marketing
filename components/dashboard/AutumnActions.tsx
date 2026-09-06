import { Section } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";
import { shortDate } from "@/lib/analytics/format";
import type { AutumnAction } from "@/types/database";

/** What Autumn did about it. Records come from the database, not from copy. */

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
    <Section eyebrow="Your marketing team" title="What Autumn is working on">
      {actions.length === 0 ? (
        <EmptyState title="No recorded activity in this period yet." />
      ) : (
        <ol className="space-y-5">
          {actions.map((action) => (
            <li key={action.id} className="border-b border-rule pb-5 last:border-0 last:pb-0">
              <p className="text-[15px] font-semibold leading-snug text-ink">
                {action.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {action.description}
              </p>
              <p className="mt-2 flex items-center gap-2 text-xs text-ink-faint">
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${
                    action.status === "completed" ? "bg-rule-strong" : "bg-harbor"
                  }`}
                />
                {STATUS_COPY[action.status]} · {shortDate(action.action_date, timezone)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
