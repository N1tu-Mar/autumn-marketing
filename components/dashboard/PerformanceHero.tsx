import Link from "next/link";
import { headlineStatus } from "@/lib/analytics/insights";
import { count, currency } from "@/lib/analytics/format";
import { ChangePill } from "@/components/ui/ChangePill";
import { EmptyState } from "@/components/ui/EmptyState";
import { GuestJourney } from "./GuestJourney";
import type { ComparedMetrics, DateRange } from "@/types/analytics";

/**
 * The 30-second answer.
 *
 * Revenue is the only number set at display size; bookings, the comparison and
 * average booking value sit beneath it as supporting context rather than as
 * three more cards competing for the same attention.
 */
export function PerformanceHero({
  metrics,
  range,
  detailHref,
}: {
  metrics: ComparedMetrics;
  range: DateRange;
  detailHref: string;
}) {
  const { current } = metrics;
  const noBookings = current.bookings === 0;

  return (
    <section className="card rise overflow-hidden">
      <div className="px-5 pb-6 pt-6 sm:px-8 sm:pb-7 sm:pt-7">
        <p className="eyebrow">
          {range.label} · compared with the {range.comparison.label}
        </p>

        <h2 className="spoken mt-3 max-w-2xl text-[30px] text-ink sm:text-[38px]">
          {headlineStatus(metrics)}
        </h2>

        {noBookings ? (
          <div className="mt-6">
            <EmptyState
              title="No direct bookings were attributed to Autumn in this period."
              detail="Try a longer reporting period, or check back once campaigns have been running for a full booking cycle."
            />
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap items-end gap-x-12 gap-y-6">
            <div>
              <p className="tnum text-[46px] font-semibold leading-none tracking-[-0.03em] text-ink sm:text-[60px]">
                {currency(current.bookingRevenue)}
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                Direct booking revenue from Autumn
              </p>
              <p className="mt-2.5">
                <ChangePill delta={metrics.revenue} />
              </p>
            </div>

            <dl className="flex gap-x-10 gap-y-4">
              <div>
                <dt className="text-[13px] text-ink-soft">Direct bookings</dt>
                <dd className="tnum mt-0.5 text-[22px] font-semibold text-ink">
                  {count(current.bookings)}
                </dd>
                <dd className="mt-1">
                  <ChangePill delta={metrics.bookings} suffix="vs last year" size="sm" />
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-ink-soft">Average booking</dt>
                <dd className="tnum mt-0.5 text-[22px] font-semibold text-ink">
                  {currency(current.averageBookingValue)}
                </dd>
                <dd className="mt-1">
                  <ChangePill
                    delta={metrics.averageBookingValue}
                    suffix="vs last year"
                    size="sm"
                  />
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      <div className="border-t border-rule bg-surface-sunk/60 px-5 py-6 sm:px-8">
        <GuestJourney metrics={current} />
      </div>

      <div className="border-t border-rule px-5 py-3.5 sm:px-8">
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
