import { Band } from "@/components/ui/Band";
import type { Insight } from "@/types/analytics";

/**
 * Editorial, not widgets. Each item explains something the headline cannot
 * say on its own, so there are at most two and none of them are boxed.
 */
export function InsightsSection({
  heading,
  insights,
}: {
  heading: string;
  insights: Insight[];
}) {
  if (insights.length === 0) {
    return (
      <Band title={heading}>
        <p className="max-w-prose text-[15px] leading-relaxed text-ink-soft">
          Once there is a full period of marketing activity, the changes worth
          knowing about will appear here.
        </p>
      </Band>
    );
  }

  return (
    <Band title={heading}>
      <ul className="max-w-prose space-y-7">
        {insights.map((insight) => (
          <li key={insight.id}>
            <h3
              className={`text-[16px] font-semibold leading-snug ${
                insight.tone === "concern" ? "text-clay" : "text-ink"
              }`}
            >
              {insight.title}
            </h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">
              {insight.detail}
            </p>
          </li>
        ))}
      </ul>
    </Band>
  );
}
