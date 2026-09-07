import { Band } from "@/components/ui/Band";
import { HelpTip } from "@/components/ui/HelpTip";
import { METRIC_LANGUAGE } from "@/lib/content/metric-language";
import { count, currency, percent } from "@/lib/analytics/format";
import { ratio } from "@/lib/analytics/metrics";
import type { PeriodMetrics } from "@/types/analytics";

/**
 * The whole path, including the two steps the main screen leaves out.
 *
 * This page is where ad clicks and the click rate belong: someone got here by
 * asking how the bookings happened. Each step is a number and a plain label,
 * and the rate that connects it to the next step sits on the connector, phrased
 * as something that happened rather than as a rate.
 */
export function MarketingJourney({
  metrics,
  propertyName,
}: {
  metrics: PeriodMetrics;
  propertyName: string;
}) {
  const steps = [
    { label: METRIC_LANGUAGE.impressions.label, value: count(metrics.impressions) },
    { label: METRIC_LANGUAGE.clicks.label, value: count(metrics.clicks) },
    { label: METRIC_LANGUAGE.websiteVisits.label, value: count(metrics.websiteVisits) },
    { label: METRIC_LANGUAGE.bookings.label, value: count(metrics.bookings) },
  ];

  const visitRate = ratio(metrics.websiteVisits, metrics.clicks);

  const rates = [
    {
      text: "of ad appearances led to a click",
      value: percent(metrics.clickThroughRate),
      help: METRIC_LANGUAGE.clickThroughRate,
    },
    {
      text: "of those clicks reached your website",
      value: percent(visitRate),
      help: null,
    },
    {
      text: "of those visits ended in a direct booking",
      value: percent(metrics.bookingRate),
      help: METRIC_LANGUAGE.bookingRate,
    },
  ];

  // Clicks and visits rarely match, and an unexplained gap reads as a fault in
  // the reporting rather than as how the web works.
  const visitsTrailClicks = metrics.clicks > 0 && metrics.websiteVisits < metrics.clicks;

  const dollarsPerDollar = metrics.returnOnAdSpend;

  return (
    <Band title={`How travelers found ${propertyName} and booked`}>
      <p className="mb-6 max-w-prose text-[15px] leading-relaxed text-ink-soft">
        Each step is what happened next after the one above it.
      </p>

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
              <div className="my-2 flex items-start gap-2.5 pl-1">
                <span aria-hidden="true" className="mt-1 h-5 w-px shrink-0 bg-rule-strong" />
                <span className="text-[13px] leading-relaxed text-ink-faint">
                  <span className="tnum">{rates[index].value}</span>{" "}
                  {rates[index].text}
                  {rates[index].help ? (
                    <HelpTip
                      label={rates[index].help.technicalLabel}
                      text={rates[index].help.help}
                    />
                  ) : null}
                </span>
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      {visitsTrailClicks ? (
        <p className="mt-5 max-w-prose text-[13px] leading-relaxed text-ink-faint">
          Some travelers click an ad and leave before your website finishes
          loading, so visits are always lower than clicks.
        </p>
      ) : null}

      <div className="mt-6 max-w-prose border-t border-rule/60 pt-5">
        <h3 className="text-[15px] font-semibold text-ink">Your advertising spend</h3>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
          <span className="tnum">{currency(metrics.adSpend)}</span> spent on
          advertising, and{" "}
          <span className="tnum">{currency(metrics.bookingRevenue)}</span> in direct
          booking revenue connected to it.
          {dollarsPerDollar !== null ? (
            <>
              {" "}
              That is about{" "}
              <span className="tnum font-medium text-ink">
                {currency(dollarsPerDollar, { cents: true })}
              </span>{" "}
              in booking revenue for every $1 spent.
            </>
          ) : null}
        </p>
        {dollarsPerDollar !== null ? (
          <p className="tnum mt-2 text-[13px] text-ink-faint">
            {dollarsPerDollar.toFixed(1)}× return on ad spend
            <HelpTip
              label={METRIC_LANGUAGE.returnOnAdSpend.technicalLabel}
              text={METRIC_LANGUAGE.returnOnAdSpend.help}
            />
          </p>
        ) : null}
      </div>
    </Band>
  );
}
