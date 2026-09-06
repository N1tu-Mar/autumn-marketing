import { count, currency, signedPercent } from "@/lib/analytics/format";
import type { ComparedMetrics } from "@/types/analytics";

/** Restates the outcome once, compactly, so the reader stays oriented. */
export function BookingSummary({ metrics }: { metrics: ComparedMetrics }) {
  const { current } = metrics;

  return (
    <div className="rise">
      <p className="tnum text-[42px] font-semibold leading-none tracking-[-0.03em] text-ink sm:text-[52px]">
        {currency(current.bookingRevenue)}
      </p>
      <p className="mt-3 text-[15px] text-ink-soft">
        <span className="tnum font-medium text-ink">{count(current.bookings)}</span>{" "}
        direct bookings
        {metrics.revenue.ratio !== null ? (
          <>
            <span aria-hidden="true" className="mx-2.5 text-rule-strong">
              ·
            </span>
            <span
              className={
                metrics.revenue.direction === "down" ? "text-clay" : "text-harbor"
              }
            >
              <span aria-hidden="true">
                {metrics.revenue.direction === "down" ? "↓ " : "↑ "}
              </span>
              <span className="tnum">{signedPercent(metrics.revenue.ratio)}</span>{" "}
              from the same period last year
            </span>
          </>
        ) : null}
      </p>
    </div>
  );
}
