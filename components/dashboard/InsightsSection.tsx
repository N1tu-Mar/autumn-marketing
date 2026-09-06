import { Section } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Insight } from "@/types/analytics";

/**
 * Insights are chosen by rules over queried numbers, not written by a model.
 * Concerns are ranked above good news so nothing important hides below a win.
 */

const TONE: Record<Insight["tone"], { bar: string; chip: string; word: string }> = {
  concern: { bar: "bg-clay", chip: "bg-clay-wash text-clay", word: "Watch" },
  positive: { bar: "bg-harbor", chip: "bg-harbor-wash text-harbor-deep", word: "Up" },
  neutral: { bar: "bg-rule-strong", chip: "bg-surface-sunk text-ink-soft", word: "Steady" },
};

export function InsightsSection({ insights }: { insights: Insight[] }) {
  return (
    <Section eyebrow="Since the same period last year" title="What changed">
      {insights.length === 0 ? (
        <EmptyState
          title="Nothing to compare yet."
          detail="Once there is a full period of marketing activity, changes worth knowing about will appear here."
        />
      ) : (
        <ul className="space-y-4">
          {insights.map((insight) => {
            const tone = TONE[insight.tone];
            return (
              <li key={insight.id} className="flex gap-3.5">
                <span
                  aria-hidden="true"
                  className={`mt-1 w-[3px] shrink-0 rounded-full ${tone.bar}`}
                />
                <div>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[15px] font-semibold leading-snug text-ink">
                      {insight.title}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone.chip}`}
                    >
                      {tone.word}
                    </span>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                    {insight.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
