import { EmptyState } from "@/components/ui/EmptyState";
import { HelpTip } from "@/components/ui/HelpTip";
import { CAMPAIGN_COPY } from "@/lib/content/campaign-copy";
import { METRIC_LANGUAGE } from "@/lib/content/metric-language";
import { count, currency, percent, plural } from "@/lib/analytics/format";
import { ratio } from "@/lib/analytics/metrics";
import type { CampaignBreakdown } from "@/types/analytics";

/**
 * Every number, for the person who wants every number.
 *
 * It is folded away by default because a hotel owner does not need it to
 * understand the page, and it is complete when opened because a GM or an
 * agency does. Columns are named in the language the rest of the page uses,
 * with the industry term in the help text beside them; rows name the traveler
 * first and the campaign second. On narrow screens the same rows become
 * stacked cards rather than a table nobody can read.
 */
export function CampaignTable({ campaigns: all }: { campaigns: CampaignBreakdown[] }) {
  // A campaign that ran in some other period contributes an all-zero row here,
  // which reads as a fault rather than as an absence. Leave it out.
  const campaigns = all.filter((c) => c.impressions > 0 || c.bookings > 0);

  if (campaigns.length === 0) {
    return (
      <EmptyState
        title="No ads ran for your hotel during this period."
        detail="Try a longer reporting period to see marketing activity."
      />
    );
  }

  const totals = campaigns.reduce(
    (acc, c) => ({
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      visits: acc.visits + c.website_visits,
      bookings: acc.bookings + c.bookings,
      revenue: acc.revenue + c.booking_revenue,
    }),
    { impressions: 0, clicks: 0, visits: 0, bookings: 0, revenue: 0 },
  );

  // Rates on the total row are recomputed from the totals. Averaging the four
  // percentages above would produce a number that is not true of anything.
  const totalClickRate = ratio(totals.clicks, totals.impressions);
  const totalBookingRate = ratio(totals.bookings, totals.visits);

  const columns = [
    { key: "impressions", metric: METRIC_LANGUAGE.impressions },
    { key: "visits", metric: METRIC_LANGUAGE.websiteVisits },
    { key: "clickRate", metric: METRIC_LANGUAGE.clickThroughRate },
    { key: "bookings", metric: METRIC_LANGUAGE.bookings },
    { key: "bookingRate", metric: METRIC_LANGUAGE.bookingRate },
    { key: "revenue", metric: METRIC_LANGUAGE.bookingRevenue },
  ] as const;

  return (
    <details className="group border-t border-rule/70 pt-6">
      <summary className="cursor-pointer list-none text-sm font-medium text-harbor transition-colors hover:text-harbor-deep">
        See detailed marketing numbers
        <span aria-hidden="true" className="ml-1.5 inline-block group-open:rotate-180">
          ↓
        </span>
      </summary>

      <p className="mt-4 max-w-prose text-[14px] leading-relaxed text-ink-soft">
        Every type of marketing Autumn ran for you in this period, with the
        highest booking revenue first.
      </p>

      {/* Table for pointer-and-keyboard width. */}
      <div className="mt-5 hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">
            How each type of marketing performed in the selected period, ordered by
            direct booking revenue.
          </caption>
          <thead>
            <tr className="border-b border-rule text-left align-bottom text-[12px] text-ink-faint">
              <th scope="col" className="py-3 pr-4 pl-0 font-semibold leading-snug">
                Type of marketing
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`py-3 text-right font-semibold leading-snug ${
                    column.key === "revenue" ? "pl-4 pr-0" : "px-4"
                  }`}
                >
                  {column.metric.label}
                  <HelpTip
                    label={column.metric.technicalLabel ?? column.metric.label}
                    text={column.metric.help}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => {
              const copy = CAMPAIGN_COPY[campaign.campaign_type];
              return (
                <tr key={campaign.campaign_id} className="border-b border-rule last:border-0">
                  <th scope="row" className="py-3.5 pr-4 pl-0 text-left font-medium text-ink">
                    {copy.guestLabel}
                    <span className="block text-[12px] font-normal text-ink-faint">
                      {campaign.campaign_name}
                    </span>
                  </th>
                  <td className="tnum px-4 py-3.5 text-right text-ink-soft">
                    {count(campaign.impressions)}
                  </td>
                  <td className="tnum px-4 py-3.5 text-right text-ink-soft">
                    {count(campaign.website_visits)}
                  </td>
                  <td className="tnum px-4 py-3.5 text-right text-ink-soft">
                    {percent(campaign.clickThroughRate)}
                  </td>
                  <td className="tnum px-4 py-3.5 text-right text-ink">
                    {count(campaign.bookings)}
                  </td>
                  <td className="tnum px-4 py-3.5 text-right text-ink-soft">
                    {percent(campaign.bookingRate)}
                  </td>
                  <td className="tnum py-3.5 pl-4 pr-0 text-right font-semibold text-ink">
                    {currency(campaign.booking_revenue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-rule-strong bg-surface-sunk/60 text-ink">
              <th scope="row" className="py-3 pr-4 pl-0 text-left font-semibold">
                All marketing
              </th>
              <td className="tnum px-4 py-3 text-right">{count(totals.impressions)}</td>
              <td className="tnum px-4 py-3 text-right">{count(totals.visits)}</td>
              <td className="tnum px-4 py-3 text-right">{percent(totalClickRate)}</td>
              <td className="tnum px-4 py-3 text-right">{count(totals.bookings)}</td>
              <td className="tnum px-4 py-3 text-right">{percent(totalBookingRate)}</td>
              <td className="tnum py-3 pl-4 pr-0 text-right font-semibold">
                {currency(totals.revenue)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Stacked cards below the table breakpoint: booking outcome first. */}
      <ul className="mt-5 divide-y divide-rule md:hidden">
        {campaigns.map((campaign) => {
          const copy = CAMPAIGN_COPY[campaign.campaign_type];
          return (
            <li key={campaign.campaign_id} className="py-4">
              <p className="text-sm font-semibold text-ink">{copy.guestLabel}</p>
              <p className="text-[12px] text-ink-faint">{campaign.campaign_name}</p>
              <p className="tnum mt-2 text-[17px] font-semibold text-ink">
                {currency(campaign.booking_revenue)}
              </p>
              <p className="tnum text-[13px] text-ink-soft">
                in booking revenue from {plural(campaign.bookings, "direct booking")}
              </p>
              <dl className="mt-3 space-y-1.5 text-[13px]">
                {[
                  [METRIC_LANGUAGE.impressions.shortLabel, count(campaign.impressions)],
                  [METRIC_LANGUAGE.websiteVisits.shortLabel, count(campaign.website_visits)],
                  [
                    METRIC_LANGUAGE.clickThroughRate.shortLabel,
                    percent(campaign.clickThroughRate),
                  ],
                  [METRIC_LANGUAGE.bookingRate.shortLabel, percent(campaign.bookingRate)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-ink-soft">{label}</dt>
                    <dd className="tnum text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
