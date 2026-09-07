import { EmptyState } from "@/components/ui/EmptyState";
import { compactCurrency, percent, plural } from "@/lib/analytics/format";
import { materialDecliningMarket } from "@/lib/analytics/narrative";
import { comparisonPeriodLabel } from "@/lib/content/metric-language";
import type { DateRange, Delta, MarketBreakdown } from "@/types/analytics";

/**
 * The leading market gets the headline; the rest are a compact ranked list.
 *
 * Declines are interpreted rather than coloured red and left for the owner to
 * worry about, and only when the market is a real share of revenue — a tiny
 * market halving is noise, and reporting it would make the product anxious.
 */

/** "24% more" / "18% less" — never a bare signed number in a column. */
function changeWords(delta: Delta | null): string | null {
  if (!delta || delta.ratio === null) return null;
  if (delta.direction === "flat") return "about level";
  return `${percent(Math.abs(delta.ratio))} ${delta.direction === "up" ? "more" : "less"}`;
}

export function FeederMarkets({
  markets,
  range,
}: {
  markets: MarketBreakdown[];
  range: DateRange;
}) {
  if (markets.length === 0) {
    return (
      <section>
        <h2 className="text-[22px] font-semibold tracking-[-0.015em] text-ink sm:text-[24px]">
          Where your booking guests are coming from
        </h2>
        <div className="mt-6">
          <EmptyState
            title="No direct bookings were connected to Autumn marketing in this period."
            detail="Try a longer reporting period to see more booking activity."
          />
        </div>
      </section>
    );
  }

  const [leader, ...rest] = markets;
  const grew = leader.revenueDelta?.ratio != null && leader.revenueDelta.ratio > 0.02;
  const falling = materialDecliningMarket(markets);
  const others = rest.slice(0, 4);
  const period = comparisonPeriodLabel(range);
  const leaderChange = changeWords(leader.revenueDelta);

  const heading = grew
    ? `${leader.guest_city} is sending you more guests than last year`
    : `${leader.guest_city} is your largest source of booking guests`;

  return (
    <section>
      <p className="eyebrow">Where your booking guests are coming from</p>
      <h2 className="mt-3 max-w-[24ch] text-[24px] font-semibold leading-[1.2] tracking-[-0.015em] text-ink sm:max-w-[34ch] sm:text-[28px]">
        {heading}
      </h2>

      <div className="mt-7">
        <p className="tnum text-[36px] font-semibold leading-none tracking-[-0.025em] text-ink sm:text-[42px]">
          {compactCurrency(leader.booking_revenue)}
        </p>
        <p className="mt-2.5 max-w-prose text-[15px] text-ink-soft">
          in direct booking revenue from travelers in {leader.guest_city}. That is{" "}
          <span className="tnum">{percent(leader.revenueShare)}</span> of your
          booking revenue
          {leaderChange ? (
            <>
              , and {leaderChange} than {period}
            </>
          ) : null}
          .
        </p>
      </div>

      {others.length > 0 ? (
        <table className="mt-8 w-full text-[15px]">
          <caption className="sr-only">
            Your next largest guest markets, with direct booking revenue and the
            change against {period}.
          </caption>
          <thead>
            <tr className="border-b border-rule text-[12px] text-ink-faint">
              <th scope="col" className="py-2 pl-0 pr-4 text-left font-semibold">
                Guest market
              </th>
              <th scope="col" className="px-4 py-2 text-right font-semibold">
                Booking revenue
              </th>
              <th scope="col" className="py-2 pl-4 pr-0 text-right font-semibold">
                Change from last year
              </th>
            </tr>
          </thead>
          <tbody>
            {others.map((market) => {
              const change = changeWords(market.revenueDelta);
              return (
                <tr key={market.guest_city} className="border-b border-rule/60 last:border-0">
                  <th scope="row" className="py-3 pl-0 pr-4 text-left font-normal text-ink">
                    {market.guest_city}
                  </th>
                  <td className="tnum px-4 py-3 text-right text-ink">
                    {compactCurrency(market.booking_revenue)}
                  </td>
                  <td
                    className={`tnum py-3 pl-4 pr-0 text-right text-[14px] ${
                      change === null ? "text-ink-faint" : "text-ink-soft"
                    }`}
                  >
                    {change ?? "No bookings last year"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}

      {falling && falling.guest_city !== leader.guest_city ? (
        <p className="mt-5 max-w-prose text-[14px] leading-relaxed text-ink-soft">
          <span className="font-medium text-ink">
            {falling.guest_city} sent fewer bookings this period.
          </span>{" "}
          Travelers from {falling.guest_city} booked{" "}
          {compactCurrency(falling.booking_revenue)} across{" "}
          {plural(falling.bookings, "booking")}, {changeWords(falling.revenueDelta)} than{" "}
          {period}. That market is {percent(falling.revenueShare)} of your booking
          revenue this period.
        </p>
      ) : null}

      {markets.length > others.length + 1 ? (
        <details className="mt-5">
          <summary className="cursor-pointer list-none text-sm font-medium text-harbor transition-colors hover:text-harbor-deep">
            See all {markets.length} guest markets
            <span aria-hidden="true" className="ml-1.5">
              ↓
            </span>
          </summary>
          <ul className="mt-3">
            {markets.slice(others.length + 1).map((market) => (
              <li
                key={market.guest_city}
                className="flex items-baseline justify-between gap-4 border-b border-rule/60 py-2.5 last:border-0"
              >
                <span className="text-[14px] text-ink-soft">{market.guest_city}</span>
                <span className="tnum text-[14px] text-ink-soft">
                  {compactCurrency(market.booking_revenue)} ·{" "}
                  {plural(market.bookings, "booking")}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
