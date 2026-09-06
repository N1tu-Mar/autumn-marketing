import { Band } from "@/components/ui/Band";
import { EmptyState } from "@/components/ui/EmptyState";
import { compactCurrency, plural, signedPercent } from "@/lib/analytics/format";
import type { MarketBreakdown } from "@/types/analytics";

/** Five markets, aligned like a list rather than boxed like cards. */
export function FeederMarkets({ markets }: { markets: MarketBreakdown[] }) {
  const top = markets.slice(0, 5);
  const rest = markets.slice(5);

  return (
    <Band title="Where your guests come from">
      {top.length === 0 ? (
        <EmptyState title="No attributed bookings in this period." />
      ) : (
        <>
          <ul>
            {top.map((market) => (
              <li
                key={market.guest_city}
                className="flex items-baseline justify-between gap-4 border-b border-rule/60 py-3.5 last:border-0"
              >
                <span className="text-[15px] text-ink">{market.guest_city}</span>
                <span className="flex items-baseline gap-4 text-right sm:gap-6">
                  <span className="tnum text-[15px] font-semibold text-ink">
                    {compactCurrency(market.booking_revenue)}
                  </span>
                  <span className="tnum hidden w-24 text-[14px] text-ink-soft sm:inline">
                    {plural(market.bookings, "booking")}
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

          {rest.length > 0 ? (
            <details className="group mt-4">
              <summary className="cursor-pointer list-none text-sm font-medium text-harbor transition-colors hover:text-harbor-deep">
                See all {markets.length} markets
                <span aria-hidden="true" className="ml-1 inline-block group-open:hidden">
                  ↓
                </span>
              </summary>
              <ul className="mt-2">
                {rest.map((market) => (
                  <li
                    key={market.guest_city}
                    className="flex items-baseline justify-between gap-4 border-b border-rule/60 py-3 last:border-0"
                  >
                    <span className="text-[15px] text-ink-soft">
                      {market.guest_city}
                    </span>
                    <span className="tnum text-[14px] text-ink-soft">
                      {compactCurrency(market.booking_revenue)} ·{" "}
                      {plural(market.bookings, "booking")}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </>
      )}
    </Band>
  );
}
