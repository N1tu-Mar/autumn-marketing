import { Section } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";
import { HelpTip } from "@/components/ui/HelpTip";
import { METRIC_HELP } from "@/lib/analytics/campaign-copy";
import { count, currency, percent } from "@/lib/analytics/format";
import type { CampaignBreakdown } from "@/types/analytics";

/**
 * The full numbers, sorted by booking revenue. On narrow screens the same rows
 * become stacked cards rather than a table nobody can read.
 */
export function CampaignTable({ campaigns }: { campaigns: CampaignBreakdown[] }) {
  if (campaigns.length === 0) {
    return (
      <Section eyebrow="Every campaign" title="Campaign performance">
        <EmptyState title="No ad activity was recorded for this period." />
      </Section>
    );
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
    <Section
      eyebrow="Every campaign, highest booking revenue first"
      title="Campaign performance"
      bodyClassName="px-0 sm:px-0 py-0 sm:py-0"
    >
      {/* Table for pointer-and-keyboard width. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Campaign performance for the selected period, sorted by booking revenue.
          </caption>
          <thead>
            <tr className="border-b border-rule text-left text-[12px] uppercase tracking-wide text-ink-faint">
              <th scope="col" className="py-3 pl-6 pr-4 font-semibold">Campaign</th>
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
              <th scope="col" className="py-3 pl-4 pr-6 text-right font-semibold">
                Booking revenue
              </th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.campaign_id} className="border-b border-rule last:border-0">
                <th scope="row" className="py-3.5 pl-6 pr-4 text-left font-medium text-ink">
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
                <td className="tnum py-3.5 pl-4 pr-6 text-right font-semibold text-ink">
                  {currency(campaign.booking_revenue)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-rule-strong bg-surface-sunk/60 text-ink">
              <th scope="row" className="py-3 pl-6 pr-4 text-left font-semibold">
                All campaigns
              </th>
              <td className="tnum px-4 py-3 text-right">{count(totals.impressions)}</td>
              <td className="tnum px-4 py-3 text-right">{count(totals.visits)}</td>
              <td className="px-4 py-3" />
              <td className="tnum px-4 py-3 text-right">{count(totals.bookings)}</td>
              <td className="px-4 py-3" />
              <td className="tnum py-3 pl-4 pr-6 text-right font-semibold">
                {currency(totals.revenue)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Cards below the table breakpoint. */}
      <ul className="divide-y divide-rule md:hidden">
        {campaigns.map((campaign) => (
          <li key={campaign.campaign_id} className="px-5 py-4">
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
    </Section>
  );
}
