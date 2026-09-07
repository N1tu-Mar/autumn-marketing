import { compactCount, count, percent } from "@/lib/analytics/format";
import type { PeriodMetrics } from "@/types/analytics";

/**
 * Three steps, no rectangles, no help icons: the ads appeared, travelers came
 * to the site, some booked. Revenue is deliberately absent — it is already the
 * headline above, and repeating it here would make the journey look like a
 * second answer rather than the path to the first one.
 *
 * The labels are careful about what each number is. Impressions are ad
 * appearances, not people, and visits are visits, not visitors; writing either
 * as a headcount would be the one lie on this screen.
 */
export function GuestJourney({ metrics }: { metrics: PeriodMetrics }) {
  const steps = [
    { value: compactCount(metrics.impressions), label: "times your ads were shown" },
    { value: compactCount(metrics.websiteVisits), label: "visits to your website" },
    { value: count(metrics.bookings), label: "direct bookings" },
  ];

  return (
    <div>
      <ol className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:gap-7">
        {steps.map((step, index) => (
          <li key={step.label} className="flex items-baseline gap-3 sm:gap-7">
            {index > 0 ? (
              <span aria-hidden="true" className="text-rule-strong">
                →
              </span>
            ) : null}
            <span className="flex items-baseline gap-2">
              <span
                className={`tnum text-[21px] ${
                  index === steps.length - 1
                    ? "font-semibold text-ink"
                    : "font-medium text-ink-soft"
                }`}
              >
                {step.value}
              </span>
              <span className="text-[14px] text-ink-soft">{step.label}</span>
            </span>
          </li>
        ))}
      </ol>

      {metrics.bookingRate !== null ? (
        <p className="mt-4 text-[13px] text-ink-faint">
          <span className="tnum">{percent(metrics.bookingRate)}</span> of those
          website visits ended in a direct booking
        </p>
      ) : null}
    </div>
  );
}
