import { EmptyState } from "@/components/ui/EmptyState";
import { compactCurrency, count, percent, signedPercent } from "@/lib/analytics/format";
import { materialDecliningMarket } from "@/lib/analytics/narrative";
import type { MarketBreakdown } from "@/types/analytics";

/**
 * The leading market gets the headline; the rest are a compact ranked list.
 *
 * Declines are interpreted rather than coloured red and left for the owner to
 * worry about, and only when the market is a real share of revenue — a tiny
 * market halving is noise, and reporting it would make the product anxious.
 */
export function FeederMarkets({ markets }: { markets: MarketBreakdown[] }) {
  if (markets.length === 0) {
    return (
      <section>
        <h2 className="text-[22px] font-semibold tracking-[-0.015em] text-ink sm:text-[24px]">
          Where your guests come from
        </h2>
        <div className="mt-6">
          <EmptyState title="No attributed bookings in this period." />
        </div>
      </section>
    );
  }

  const [leader, ...rest] = markets;
  const grew = leader.revenueDelta?.ratio != null && leader.revenueDelta.ratio > 0.02;
  const falling = materialDecliningMarket(markets);
  const others = rest.slice(0, 4);

  const heading = grew
    ? `${leader.guest_city} continues to lead your guest markets`
    : `${leader.guest_city} is your largest guest market`;

  return (
    <section>
      <h2 className="max-w-[22ch] text-[24px] font-semibold leading-[1.2] tracking-[-0.015em] text-ink sm:max-w-none sm:text-[28px]">
        {heading}
      </h2>

      <div className="mt-7">
        <p className="tnum text-[36px] font-semibold leading-none tracking-[-0.025em] text-ink sm:text-[42px]">
          {compactCurrency(leader.booking_revenue)}
        </p>
        <p className="mt-2.5 text-[15px] text-ink-soft">
          {leader.revenueDelta?.ratio != null ? (
            <>
              <span
                className={`tnum ${
                  leader.revenueDelta.direction === "down" ? "text-clay" : "text-harbor"
                }`}
              >
                {signedPercent(leader.revenueDelta.ratio)}
              </span>{" "}
              from the same period last year ·{" "}
            </>
          ) : null}
          <span className="tnum">{percent(leader.revenueShare)}</span> of booking
          revenue
        </p>
      </div>

      {others.length > 0 ? (
        <ul className="mt-8">
          {others.map((market) => (
            <li
              key={market.guest_city}
              className="flex items-baseline justify-between gap-4 border-b border-rule/60 py-3 last:border-0"
            >
              <span className="text-[15px] text-ink">{market.guest_city}</span>
              <span className="flex items-baseline gap-5 text-right">
                <span className="tnum text-[15px] text-ink">
                  {compactCurrency(market.booking_revenue)}
                </span>
                <span
                  className={`tnum w-14 text-[14px] ${
                    market.revenueDelta?.ratio == null
                      ? "text-ink-faint"
                      : market.revenueDelta.direction === "down"
                        ? "text-clay"
                        : "text-harbor"
                  }`}
                >
                  {market.revenueDelta?.ratio == null
                    ? "—"
                    : signedPercent(market.revenueDelta.ratio)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {falling && falling.guest_city !== leader.guest_city ? (
        <p className="mt-5 max-w-prose text-[14px] leading-relaxed text-ink-soft">
          <span className="font-medium text-ink">
            {falling.guest_city} softened this period.
          </span>{" "}
          Revenue from {falling.guest_city} fell{" "}
          {signedPercent(falling.revenueDelta?.ratio ?? null)} to{" "}
          {compactCurrency(falling.booking_revenue)}, from{" "}
          {count(falling.bookings)} bookings.
        </p>
      ) : null}

      {markets.length > others.length + 1 ? (
        <details className="mt-5">
          <summary className="cursor-pointer list-none text-sm font-medium text-harbor transition-colors hover:text-harbor-deep">
            See all {markets.length} guest markets ↓
          </summary>
          <ul className="mt-3">
            {markets.slice(5).map((market) => (
              <li
                key={market.guest_city}
                className="flex items-baseline justify-between gap-4 border-b border-rule/60 py-2.5 last:border-0"
              >
                <span className="text-[14px] text-ink-soft">{market.guest_city}</span>
                <span className="tnum text-[14px] text-ink-soft">
                  {compactCurrency(market.booking_revenue)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
