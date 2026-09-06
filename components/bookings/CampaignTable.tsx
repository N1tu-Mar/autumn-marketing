import { EmptyState } from "@/components/ui/EmptyState";
import { HelpTip } from "@/components/ui/HelpTip";
import { METRIC_HELP } from "@/lib/analytics/campaign-copy";
import { count, currency, percent } from "@/lib/analytics/format";
import type { CampaignBreakdown } from "@/types/analytics";

/**
 * The full numbers, sorted by booking revenue. On narrow screens the same rows
 * become stacked cards rather than a table nobody can read.
 */
export function CampaignTable({ campaigns: all }: { campaigns: CampaignBreakdown[] }) {
  // A campaign that ran in some other period contributes an all-zero row here,
  // which reads as a fault rather than as an absence. Leave it out.
  const campaigns = all.filter((c) => c.impressions > 0 || c.bookings > 0);

  if (campaigns.length === 0) {
    return <EmptyState title="No ad activity was recorded for this period." />;
  }

  const totals = campaigns.reduce(
    (acc, c) => ({
      impressions: acc.impressions + c.impressions,
      visits: acc.visits + c.website_visits,
      bookings: acc.bookings + c.bookings,
      revenue: acc.revenue + c.booking_revenue,
    }),
    { impressions: 0, visits: 0, bookings: 0, revenue: 0 },
  );

  return (
    <details className="group border-t border-rule/70 pt-6">
      <summary className="cursor-pointer list-none text-sm font-medium text-harbor transition-colors hover:text-harbor-deep">
        View detailed campaign metrics
        <span aria-hidden="true" className="ml-1.5 inline-block group-open:rotate-180">
          ↓
        </span>
      </summary>

      {/* Table for pointer-and-keyboard width. */}
      <div className="mt-5 hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Campaign performance for the selected period, sorted by booking revenue.
          </caption>
          <thead>
            <tr className="border-b border-rule text-left text-[12px] uppercase tracking-wide text-ink-faint">
              <th scope="col" className="py-3 pr-4 pl-0 font-semibold">Campaign</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Ad appearances
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Website visits
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Click-through
                <HelpTip label="click-through rate" text={METRIC_HELP.clickThroughRate} />
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Direct bookings
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Booking rate
                <HelpTip label="booking rate" text={METRIC_HELP.bookingRate} />
              </th>
              <th scope="col" className="py-3 pl-4 pr-0 text-right font-semibold">
                Booking revenue
              </th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.campaign_id} className="border-b border-rule last:border-0">
                <th scope="row" className="py-3.5 pr-4 pl-0 text-left font-medium text-ink">
                  {campaign.campaign_name}
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
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-rule-strong bg-surface-sunk/60 text-ink">
              <th scope="row" className="py-3 pr-4 pl-0 text-left font-semibold">
                All campaigns
              </th>
              <td className="tnum px-4 py-3 text-right">{count(totals.impressions)}</td>
              <td className="tnum px-4 py-3 text-right">{count(totals.visits)}</td>
              <td className="px-4 py-3" />
              <td className="tnum px-4 py-3 text-right">{count(totals.bookings)}</td>
              <td className="px-4 py-3" />
              <td className="tnum py-3 pl-4 pr-0 text-right font-semibold">
                {currency(totals.revenue)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Cards below the table breakpoint. */}
      <ul className="mt-5 divide-y divide-rule md:hidden">
        {campaigns.map((campaign) => (
          <li key={campaign.campaign_id} className="py-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-ink">{campaign.campaign_name}</p>
              <p className="tnum text-sm font-semibold text-ink">
                {currency(campaign.booking_revenue)}
              </p>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
              {[
                ["Ad appearances", count(campaign.impressions)],
                ["Website visits", count(campaign.website_visits)],
                ["Click-through", percent(campaign.clickThroughRate)],
                ["Direct bookings", count(campaign.bookings)],
                ["Booking rate", percent(campaign.bookingRate)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-ink-soft">{label}</dt>
                  <dd className="tnum text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </details>
  );
}
