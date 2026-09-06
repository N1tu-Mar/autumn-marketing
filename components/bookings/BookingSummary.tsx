import { ChangePill } from "@/components/ui/ChangePill";
import { count, currency } from "@/lib/analytics/format";
import type { ComparedMetrics } from "@/types/analytics";

/** Keeps the reader oriented: the same four outcomes, restated compactly. */
export function BookingSummary({ metrics }: { metrics: ComparedMetrics }) {
  const { current } = metrics;

  const items = [
    {
      label: "Direct booking revenue",
      value: currency(current.bookingRevenue),
      delta: metrics.revenue,
      lead: true,
    },
    {
      label: "Direct bookings",
      value: count(current.bookings),
      delta: metrics.bookings,
      lead: false,
    },
    {
      label: "Average booking",
      value: currency(current.averageBookingValue),
      delta: metrics.averageBookingValue,
      lead: false,
    },
  ];

  return (
    <dl className="card rise grid gap-6 px-5 py-6 sm:grid-cols-3 sm:px-8">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[13px] text-ink-soft">{item.label}</dt>
          <dd
            className={`tnum mt-1 font-semibold tracking-[-0.02em] text-ink ${
              item.lead ? "text-[34px] leading-none" : "text-[26px] leading-none"
            }`}
          >
            {item.value}
          </dd>
          <dd className="mt-2">
            <ChangePill delta={item.delta} size="sm" />
          </dd>
        </div>
      ))}
    </dl>
  );
}
