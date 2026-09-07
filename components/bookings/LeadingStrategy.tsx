import { EmptyState } from "@/components/ui/EmptyState";
import { CAMPAIGN_COPY } from "@/lib/content/campaign-copy";
import { compactCurrency, currency, percent, plural } from "@/lib/analytics/format";
import type { CampaignBreakdown } from "@/types/analytics";

/**
 * One type of marketing is usually carrying the period. Giving all of them
 * equal visual weight hides that, so the leader gets the space and the rest
 * form a quiet ranked list beneath it. Which one leads is decided by booking
 * revenue, not by type.
 *
 * Every row names the traveler first and the industry term second. An owner
 * should be able to read this section without ever learning what metasearch
 * is, and an agency should still be able to reconcile it with one.
 */
export function LeadingStrategy({ campaigns }: { campaigns: CampaignBreakdown[] }) {
  const earning = campaigns.filter((c) => c.booking_revenue > 0);

  if (earning.length === 0) {
    return (
      <section>
        <h2 className="text-[22px] font-semibold tracking-[-0.015em] text-ink sm:text-[24px]">
          Where your direct bookings came from
        </h2>
        <div className="mt-6">
          <EmptyState
            title="No type of marketing produced a direct booking in this period."
            detail="Try a longer reporting period to see more booking activity."
          />
        </div>
      </section>
    );
  }

  const [leader, ...rest] = earning;
  const leadCopy = CAMPAIGN_COPY[leader.campaign_type];
  const maxRestShare = Math.max(...rest.map((c) => c.revenueShare), 0.0001);

  return (
    <section>
      <p className="eyebrow">Where your direct bookings came from</p>
      <h2 className="mt-3 max-w-[24ch] text-[24px] font-semibold leading-[1.2] tracking-[-0.015em] text-ink sm:max-w-[34ch] sm:text-[28px]">
        {leadCopy.subject} brought in the most booking revenue
      </h2>

      <div className="mt-7 border-l-2 border-harbor pl-6">
        <p className="text-[13px] text-ink-faint">
          {leader.campaign_name}
          {leader.campaign_name === leadCopy.label ? "" : ` · ${leadCopy.label}`}
        </p>
        <p className="tnum mt-2 text-[36px] font-semibold leading-none tracking-[-0.025em] text-ink sm:text-[42px]">
          {currency(leader.booking_revenue)}
        </p>
        <p className="mt-2.5 text-[15px] text-ink-soft">
          in direct booking revenue from{" "}
          <span className="tnum">{plural(leader.bookings, "booking")}</span> —{" "}
          <span className="tnum">{percent(leader.revenueShare)}</span> of your direct
          booking revenue
        </p>
        <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink-soft">
          {leadCopy.description}
        </p>
      </div>

      {rest.length > 0 ? (
        <div className="mt-9">
          <h3 className="eyebrow mb-4">Your other booking drivers</h3>
          <ul>
            {rest.map((campaign) => {
              const copy = CAMPAIGN_COPY[campaign.campaign_type];
              return (
                <li
                  key={campaign.campaign_id}
                  className="border-b border-rule/60 py-3.5 last:border-0"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="text-[15px] text-ink">
                      {copy.guestLabel}
                      <span className="ml-2 text-[13px] text-ink-faint">
                        {campaign.campaign_name}
                      </span>
                    </span>
                    <span className="tnum shrink-0 text-[15px] text-ink">
                      <span className="font-semibold">
                        {compactCurrency(campaign.booking_revenue)}
                      </span>
                      <span className="ml-3 text-ink-soft">
                        {percent(campaign.revenueShare)} of booking revenue
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-sunk">
                    <div
                      aria-hidden="true"
                      className="h-full rounded-full bg-harbor/45"
                      style={{
                        width: `${(campaign.revenueShare / maxRestShare) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
