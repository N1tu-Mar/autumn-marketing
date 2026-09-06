import { Section } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChangePill } from "@/components/ui/ChangePill";
import { withOtherMarkets } from "@/lib/analytics/metrics";
import { count, currency, percent } from "@/lib/analytics/format";
import type { MarketBreakdown } from "@/types/analytics";

/** Answers "are the right guests finding my property?" — a ranked list, not a map. */
export function FeederMarkets({ markets }: { markets: MarketBreakdown[] }) {
  const { top, other } = withOtherMarkets(markets, 6);
  const maxShare = Math.max(...top.map((m) => m.revenueShare), 0.0001);

  return (
    <Section eyebrow="Guest home markets" title="Where booking guests come from">
      {top.length === 0 ? (
        <EmptyState title="No attributed bookings in this period." />
      ) : (
        <ul className="space-y-4">
          {top.map((market) => (
            <li key={market.guest_city}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-sm font-medium text-ink">
                  {market.guest_city}
                  {market.guest_region ? (
                    <span className="text-ink-faint">, {market.guest_region}</span>
                  ) : null}
                </p>
                <p className="tnum text-sm text-ink">
                  <span className="font-semibold">
                    {currency(market.booking_revenue)}
                  </span>
                  <span className="text-ink-soft">
                    {" "}
                    · {count(market.bookings)} bookings
                  </span>
                </p>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunk">
                <div
                  className="h-full rounded-full bg-harbor/70"
                  style={{ width: `${(market.revenueShare / maxShare) * 100}%` }}
                />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-ink-faint">
                <span className="tnum">{percent(market.revenueShare)} of revenue</span>
                {market.revenueDelta ? (
                  <ChangePill
                    delta={market.revenueDelta}
                    suffix="vs last year"
                    size="sm"
                  />
                ) : null}
              </div>
            </li>
          ))}

          {other ? (
            <li className="border-t border-rule pt-4 text-sm text-ink-soft">
              <span className="font-medium text-ink">All other markets</span>
              <span className="tnum">
                {" "}
                · {currency(other.revenue)} · {count(other.bookings)} bookings
              </span>
            </li>
          ) : null}
        </ul>
      )}
    </Section>
  );
}
