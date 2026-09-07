import { count, currency } from "@/lib/analytics/format";
import { comparisonSentence } from "@/lib/content/metric-language";
import type { ComparedMetrics, DateRange } from "@/types/analytics";

/**
 * Restates the outcome once, compactly, so the reader stays oriented after
 * following a link out of the main screen. Same wording as the hero, on
 * purpose: two screens describing one number should describe it identically.
 */
export function BookingSummary({
  metrics,
  range,
  propertyName,
}: {
  metrics: ComparedMetrics;
  range: DateRange;
  propertyName: string;
}) {
  const { current } = metrics;
  const comparison = comparisonSentence(metrics.revenue, range, "booking revenue");

  return (
    <div className="rise">
      <p className="tnum text-[42px] font-semibold leading-none tracking-[-0.03em] text-ink sm:text-[52px]">
        {currency(current.bookingRevenue)}
      </p>
      <p className="mt-3 max-w-[42ch] text-[15px] text-ink-soft">
        in direct booking revenue from{" "}
        <span className="tnum font-medium text-ink">{count(current.bookings)}</span>{" "}
        direct bookings made on {propertyName}&apos;s own website
      </p>
      {comparison === null ? (
        <p className="mt-1.5 text-[15px] text-ink-faint">
          There is no comparable period last year yet.
        </p>
      ) : (
        <p
          className={`mt-1.5 text-[15px] ${
            metrics.revenue.direction === "up"
              ? "text-harbor"
              : (metrics.revenue.ratio ?? 0) <= -0.08
                ? "text-clay"
                : "text-ink-soft"
          }`}
        >
          {comparison}
        </p>
      )}
    </div>
  );
}
