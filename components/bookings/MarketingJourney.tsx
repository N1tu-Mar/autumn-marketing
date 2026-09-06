import { Section } from "@/components/ui/Section";
import { HelpTip } from "@/components/ui/HelpTip";
import { METRIC_HELP } from "@/lib/analytics/campaign-copy";
import { count, currency, percent } from "@/lib/analytics/format";
import { ratio } from "@/lib/analytics/metrics";
import type { PeriodMetrics } from "@/types/analytics";

/**
 * The full chain, including the two steps the main dashboard leaves out.
 * This is the right place for ad clicks and click-through rate: supporting
 * detail for someone who came here asking how the bookings happened.
 */
export function MarketingJourney({ metrics }: { metrics: PeriodMetrics }) {
  const steps = [
    { label: "Ad appearances", value: count(metrics.impressions), help: METRIC_HELP.impressions },
    { label: "Ad clicks", value: count(metrics.clicks), help: METRIC_HELP.clicks },
    { label: "Website visits", value: count(metrics.websiteVisits), help: METRIC_HELP.websiteVisits },
    { label: "Direct bookings", value: count(metrics.bookings), help: METRIC_HELP.directBookings },
    { label: "Booking revenue", value: currency(metrics.bookingRevenue), help: METRIC_HELP.bookingRevenue },
  ];

  const rates = [
    { label: "Click-through rate", value: percent(metrics.clickThroughRate), help: METRIC_HELP.clickThroughRate },
    {
      label: "Clicks that reached the site",
      value: percent(ratio(metrics.websiteVisits, metrics.clicks)),
      help: "The share of ad clicks that finished loading your website.",
    },
    { label: "Visitor-to-booking rate", value: percent(metrics.bookingRate), help: METRIC_HELP.bookingRate },
    { label: "Average booking", value: currency(metrics.averageBookingValue), help: METRIC_HELP.averageBookingValue },
  ];

  return (
    <Section eyebrow="Step by step" title="How the marketing turned into bookings">
      <ol>
        {steps.map((step, index) => (
          <li key={step.label}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-ink-soft">
                {step.label}
                <HelpTip label={step.label} text={step.help} />
              </span>
              <span
                className={`tnum font-semibold text-ink ${
                  index === steps.length - 1 ? "text-[22px] text-harbor" : "text-[17px]"
                }`}
              >
                {step.value}
              </span>
            </div>
            {index < rates.length ? (
              <div className="my-2 flex items-center gap-2.5 pl-1">
                <span aria-hidden="true" className="h-5 w-px bg-rule-strong" />
                <span className="text-xs text-ink-faint">
                  <span className="tnum font-semibold text-harbor">
                    {rates[index].value}
                  </span>{" "}
                  {rates[index].label.toLowerCase()}
                  <HelpTip label={rates[index].label} text={rates[index].help} />
                </span>
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      <p className="mt-5 border-t border-rule pt-4 text-[13px] leading-relaxed text-ink-soft">
        <span className="tnum font-medium text-ink">
          {currency(metrics.adSpend)}
        </span>{" "}
        in ad spend over this period
        {metrics.returnOnAdSpend !== null ? (
          <>
            {" "}— <span className="tnum font-medium text-ink">
              {currency(metrics.returnOnAdSpend, { cents: true })}
            </span>{" "}
            of direct booking revenue for every dollar spent.
          </>
        ) : (
          "."
        )}
      </p>
    </Section>
  );
}
