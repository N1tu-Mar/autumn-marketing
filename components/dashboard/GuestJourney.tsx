import { compactCount, percent } from "@/lib/analytics/format";
import type { PeriodMetrics } from "@/types/analytics";

/**
 * Three steps, no rectangles, no help icons: saw the ads, came to the site,
 * booked. Revenue is deliberately absent — it is already the headline above,
 * and repeating it here would make the journey look like a second answer
 * rather than the path to the first one.
 */
export function GuestJourney({ metrics }: { metrics: PeriodMetrics }) {
  const steps = [
    { value: compactCount(metrics.impressions), label: "saw your ads" },
    { value: compactCount(metrics.websiteVisits), label: "visited your website" },
    { value: compactCount(metrics.bookings), label: "booked directly" },
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

      <p className="mt-4 text-[13px] text-ink-faint">
        <span className="tnum">{percent(metrics.bookingRate)}</span> of visitors
        from Autumn ads booked a stay
      </p>
    </div>
  );
}
