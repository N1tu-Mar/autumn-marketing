import { Section } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";
import { CAMPAIGN_COPY } from "@/lib/analytics/campaign-copy";
import { count, currency, percent } from "@/lib/analytics/format";
import type { CampaignBreakdown } from "@/types/analytics";

/**
 * Ranked by booking revenue, because that is what the owner is being asked to
 * care about. The bar length encodes share of revenue and nothing else.
 */
export function CampaignContribution({
  campaigns,
}: {
  campaigns: CampaignBreakdown[];
}) {
  const earning = campaigns.filter((c) => c.booking_revenue > 0);
  const maxShare = Math.max(...earning.map((c) => c.revenueShare), 0.0001);

  return (
    <Section
      eyebrow="Ranked by booking revenue"
      title="Booking revenue by Autumn strategy"
    >
      {earning.length === 0 ? (
        <EmptyState title="No campaign produced an attributed booking in this period." />
      ) : (
        <ul className="space-y-5">
          {earning.map((campaign) => (
            <li key={campaign.campaign_id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-[15px] font-semibold text-ink">
                  {campaign.campaign_name}
                  {campaign.status !== "active" ? (
                    <span className="ml-2 rounded bg-surface-sunk px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                      {campaign.status}
                    </span>
                  ) : null}
                </p>
                <p className="tnum text-sm text-ink">
                  <span className="font-semibold">
                    {currency(campaign.booking_revenue)}
                  </span>
                  <span className="text-ink-soft">
                    {" "}
                    · {count(campaign.bookings)} bookings ·{" "}
                    {percent(campaign.revenueShare)} of revenue
                  </span>
                </p>
              </div>

              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-sunk">
                <div
                  className="h-full rounded-full bg-harbor"
                  style={{ width: `${(campaign.revenueShare / maxShare) * 100}%` }}
                />
              </div>

              <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                {CAMPAIGN_COPY[campaign.campaign_type].description}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
