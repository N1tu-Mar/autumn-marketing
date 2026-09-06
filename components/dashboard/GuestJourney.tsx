import { count, currency, percent } from "@/lib/analytics/format";
import { METRIC_HELP } from "@/lib/analytics/campaign-copy";
import { HelpTip } from "@/components/ui/HelpTip";
import type { PeriodMetrics } from "@/types/analytics";

/**
 * The guest journey rail.
 *
 * One line, four stops, left to right: what Autumn showed, who came, who
 * booked, what it was worth. Type weight grows toward the outcome, so the eye
 * lands on revenue even when the owner reads nothing else. The conversion
 * rates sit on the connectors, subordinate to the stops they explain — a rate
 * is an explanation, never a result.
 */

type Stop = { value: string; label: string; help: string; emphasis: 0 | 1 | 2 | 3 };
type Link = { value: string; label: string; help: string };

const VALUE_SIZES = [
  "text-[19px] font-medium text-ink",
  "text-[21px] font-medium text-ink",
  "text-[25px] font-semibold text-ink",
  "text-[30px] font-semibold text-harbor",
];

export function GuestJourney({ metrics }: { metrics: PeriodMetrics }) {
  const stops: Stop[] = [
    {
      value: count(metrics.impressions),
      label: "Ad appearances",
      help: METRIC_HELP.impressions,
      emphasis: 0,
    },
    {
      value: count(metrics.websiteVisits),
      label: "Website visits",
      help: METRIC_HELP.websiteVisits,
      emphasis: 1,
    },
    {
      value: count(metrics.bookings),
      label: "Direct bookings",
      help: METRIC_HELP.directBookings,
      emphasis: 2,
    },
    {
      value: currency(metrics.bookingRevenue),
      label: "Booking revenue",
      help: METRIC_HELP.bookingRevenue,
      emphasis: 3,
    },
  ];

  const links: Link[] = [
    {
      value: percent(metrics.clickThroughRate),
      label: "click-through",
      help: METRIC_HELP.clickThroughRate,
    },
    {
      value: percent(metrics.bookingRate),
      label: "visitor-to-booking",
      help: METRIC_HELP.bookingRate,
    },
    {
      value: currency(metrics.averageBookingValue),
      label: "average booking",
      help: METRIC_HELP.averageBookingValue,
    },
  ];

  return (
    <div>
      <h3 className="eyebrow mb-4">How guests reached a booking</h3>

      {/* Desktop: a single rail, values on one baseline, rates on the joins. */}
      <ol className="hidden grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-baseline gap-x-2 sm:grid">
        {stops.map((stop, index) => (
          <li key={stop.label} className="contents">
            <div className={`${VALUE_SIZES[stop.emphasis]} tnum`}>{stop.value}</div>
            {index < links.length ? (
              <div aria-hidden="true" className="px-1 text-ink-faint">
                <span className="block h-px w-8 bg-rule-strong" />
              </div>
            ) : null}
          </li>
        ))}

        {stops.map((stop, index) => (
          <li key={`${stop.label}-label`} className="contents">
            <div className="pt-1.5 text-[13px] leading-snug text-ink-soft">
              {stop.label}
              <HelpTip label={stop.label} text={stop.help} />
            </div>
            {index < links.length ? (
              <div className="whitespace-nowrap px-2 pt-1.5 text-center text-[12px] text-ink-faint">
                <span className="tnum font-semibold text-harbor">
                  {links[index].value}
                </span>{" "}
                {links[index].label}
                <HelpTip label={links[index].label} text={links[index].help} />
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      {/* Mobile: the same rail turned on its side. */}
      <ol className="sm:hidden">
        {stops.map((stop, index) => (
          <li key={stop.label}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13px] text-ink-soft">
                {stop.label}
                <HelpTip label={stop.label} text={stop.help} />
              </span>
              <span className={`${VALUE_SIZES[stop.emphasis]} tnum`}>
                {stop.value}
              </span>
            </div>
            {index < links.length ? (
              <div className="my-2 flex items-center gap-2 pl-1">
                <span aria-hidden="true" className="h-4 w-px bg-rule-strong" />
                <span className="text-[12px] text-ink-faint">
                  <span className="tnum font-semibold text-harbor">
                    {links[index].value}
                  </span>{" "}
                  {links[index].label}
                </span>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
