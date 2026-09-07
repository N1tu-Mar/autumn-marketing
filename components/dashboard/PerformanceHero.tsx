import Link from "next/link";
import { greeting, headlineStatus } from "@/lib/analytics/insights";
import { count, currency } from "@/lib/analytics/format";
import { comparisonSentence } from "@/lib/content/metric-language";
import { EmptyState } from "@/components/ui/EmptyState";
import { GuestJourney } from "./GuestJourney";
import type { ComparedMetrics, DateRange } from "@/types/analytics";

/**
 * The briefing.
 *
 * One dominant number, one supporting count, one comparison written as a
 * sentence. Average booking value is a footnote, not a fourth statistic —
 * three growth badges side by side make the reader compare them instead of
 * reading the result.
 */
export function PerformanceHero({
  metrics,
  range,
  timezone,
  detailHref,
}: {
  metrics: ComparedMetrics;
  range: DateRange;
  timezone: string;
  detailHref: string;
}) {
  const { current } = metrics;

  if (current.bookings === 0) {
    // Two different silences: nothing ran at all, or marketing ran and no
    // booking followed. Saying which one it is spares the owner the guess.
    const marketingRan = current.impressions > 0;

    return (
      <section className="card rise px-6 py-10 sm:px-12 sm:py-12">
        <h2 className="spoken text-[30px] text-ink sm:text-[34px]">
          {headlineStatus(metrics, range)}
        </h2>
        <div className="mt-7">
          <EmptyState
            title={
              marketingRan
                ? "Your ads reached travelers in this period, but no direct bookings were connected to that activity."
                : "No direct bookings were connected to Autumn marketing in this period."
            }
            detail="Try a longer reporting period, or check back once campaigns have run for a full booking cycle."
          />
        </div>
      </section>
    );
  }

  const revenueComparison = comparisonSentence(
    metrics.revenue,
    range,
    "booking revenue",
  );

  return (
    <section className="card rise overflow-hidden">
      <div className="px-6 pb-9 pt-9 sm:px-12 sm:pb-11 sm:pt-11">
        <p className="text-[13px] text-ink-faint">{greeting(timezone)}</p>

        <h2 className="spoken mt-2.5 max-w-2xl text-[32px] leading-[1.15] text-ink sm:text-[40px]">
          {headlineStatus(metrics, range)}
        </h2>

        <p className="tnum mt-9 text-[52px] font-semibold leading-none tracking-[-0.035em] text-ink sm:text-[64px]">
          {currency(current.bookingRevenue)}
        </p>
        <p className="mt-3 max-w-[38ch] text-[15px] text-ink-soft">
          in direct booking revenue connected to Autumn marketing
        </p>

        <p className="mt-6 text-[17px] text-ink">
          <span className="tnum font-semibold">{count(current.bookings)}</span>{" "}
          direct bookings
        </p>

        {revenueComparison ? (
          // The sentence carries the meaning; colour only reinforces it, and
          // clay is held back for a drop large enough to be worth a reaction.
          <p
            className={`mt-1.5 text-[15px] ${
              metrics.revenue.direction === "up"
                ? "text-harbor"
                : (metrics.revenue.ratio ?? 0) <= -0.08
                  ? "text-clay"
                  : "text-ink-soft"
            }`}
          >
            {revenueComparison}
          </p>
        ) : (
          <p className="mt-1.5 text-[15px] text-ink-faint">
            There is no comparable period last year yet.
          </p>
        )}

        <p className="mt-4 text-[13px] text-ink-faint">
          Each booking was worth {currency(current.averageBookingValue)} on average.
        </p>
      </div>

      <div className="border-t border-rule/70 px-6 py-7 sm:px-12">
        <GuestJourney metrics={current} />
      </div>

      <div className="border-t border-rule/70 px-6 py-4 sm:px-12">
        <Link
          href={detailHref}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-harbor transition-colors hover:text-harbor-deep"
        >
          See what&apos;s driving your bookings
          <span
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
