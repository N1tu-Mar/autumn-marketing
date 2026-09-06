import { Band } from "@/components/ui/Band";
import { HelpTip } from "@/components/ui/HelpTip";
import { METRIC_HELP } from "@/lib/analytics/campaign-copy";
import { count, currency, percent } from "@/lib/analytics/format";
import { ratio } from "@/lib/analytics/metrics";
import type { PeriodMetrics } from "@/types/analytics";

/**
 * The full funnel, including the two steps the main screen leaves out.
 * This page is where ad clicks and click-through rate belong: someone got
 * here by asking how the bookings happened.
 */
export function MarketingJourney({ metrics }: { metrics: PeriodMetrics }) {
  const steps = [
    { label: "Ad appearances", value: count(metrics.impressions) },
    { label: "Ad clicks", value: count(metrics.clicks) },
    { label: "Website visits", value: count(metrics.websiteVisits) },
    { label: "Direct bookings", value: count(metrics.bookings) },
  ];

  const rates = [
    {
      text: "clicked",
      value: percent(metrics.clickThroughRate),
      help: METRIC_HELP.clickThroughRate,
    },
    {
      text: "reached the website",
      value: percent(ratio(metrics.websiteVisits, metrics.clicks)),
      help: null,
    },
    {
      text: "booked a stay",
      value: percent(metrics.bookingRate),
      help: METRIC_HELP.bookingRate,
    },
  ];

  return (
    <Band title="How the marketing turned into bookings">
      <ol>
        {steps.map((step, index) => (
          <li key={step.label}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[15px] text-ink-soft">{step.label}</span>
              <span
                className={`tnum font-semibold text-ink ${
                  index === steps.length - 1 ? "text-[21px]" : "text-[17px]"
                }`}
              >
                {step.value}
              </span>
            </div>
            {index < rates.length ? (
              <div className="my-2 flex items-center gap-2.5 pl-1">
                <span aria-hidden="true" className="h-5 w-px bg-rule-strong" />
                <span className="text-[13px] text-ink-faint">
                  <span className="tnum">{rates[index].value}</span>{" "}
                  {rates[index].text}
                  {rates[index].help ? (
                    <HelpTip label={rates[index].text} text={rates[index].help} />
                  ) : null}
                </span>
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      <p className="mt-6 max-w-prose border-t border-rule/60 pt-5 text-[14px] leading-relaxed text-ink-soft">
        <span className="tnum">{currency(metrics.adSpend)}</span> in ad spend
        generated <span className="tnum">{currency(metrics.bookingRevenue)}</span> in
        direct booking revenue
        {metrics.returnOnAdSpend !== null ? (
          <>
            {" "}— a{" "}
            <span className="tnum font-medium text-ink">
              {metrics.returnOnAdSpend.toFixed(1)}×
            </span>{" "}
            return.
          </>
        ) : (
          "."
        )}
      </p>
    </Band>
  );
}
