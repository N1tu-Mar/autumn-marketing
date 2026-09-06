import { Band } from "@/components/ui/Band";
import { EmptyState } from "@/components/ui/EmptyState";
import { CAMPAIGN_COPY } from "@/lib/analytics/campaign-copy";
import { currency, percent, plural } from "@/lib/analytics/format";
import type { CampaignBreakdown } from "@/types/analytics";

/**
 * The main explanation on this screen: which strategies produced the revenue.
 * Ranked bars rather than a table, so it can be read without arithmetic.
 */
export function CampaignContribution({
  campaigns,
}: {
  campaigns: CampaignBreakdown[];
}) {
  const earning = campaigns.filter((c) => c.booking_revenue > 0);
  const maxShare = Math.max(...earning.map((c) => c.revenueShare), 0.0001);

  return (
    <Band title="Booking revenue by strategy">
      {earning.length === 0 ? (
        <EmptyState title="No campaign produced an attributed booking in this period." />
      ) : (
        <ul className="space-y-7">
          {earning.map((campaign) => (
            <li key={campaign.campaign_id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-[16px] font-semibold text-ink">
                  {campaign.campaign_name}
                </h3>
                <p className="tnum text-[15px] font-semibold text-ink">
                  {percent(campaign.revenueShare)}
                </p>
              </div>

              <p className="tnum mt-1 text-[14px] text-ink-soft">
                {currency(campaign.booking_revenue)} · {plural(campaign.bookings, "booking")}
              </p>

              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-surface-sunk">
                <div
                  className="h-full rounded-full bg-harbor"
                  style={{ width: `${(campaign.revenueShare / maxShare) * 100}%` }}
                />
              </div>

              <p className="mt-2.5 max-w-prose text-[14px] leading-relaxed text-ink-faint">
                {CAMPAIGN_COPY[campaign.campaign_type].description}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Band>
  );
}
