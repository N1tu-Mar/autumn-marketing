import { longDate } from "@/lib/analytics/format";
import { comparisonPeriodLabel } from "@/lib/content/metric-language";
import type { DateRange } from "@/types/analytics";

/**
 * The trust note.
 *
 * One sentence of plain explanation stays visible, because an owner should
 * know what these bookings are without asking. The methodology behind it —
 * which date a booking is counted on, which campaign gets the credit, what is
 * left out — is real and auditable, and folded away, because needing it is the
 * exception rather than the reading path.
 */
export function AttributionExplainer({
  range,
  timezone,
}: {
  range: DateRange;
  timezone: string;
}) {
  return (
    <div className="max-w-prose">
      <h2 className="text-[15px] font-semibold text-ink">
        How Autumn connects bookings to marketing
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
        When a traveler sees or clicks Autumn marketing and later books directly on
        your own website, Autumn connects that reservation to the last marketing
        they engaged with before booking. Direct bookings Autumn cannot confidently
        connect to marketing are left out of this page.
      </p>

      <details className="mt-4">
        <summary className="cursor-pointer list-none text-[13px] font-medium text-harbor transition-colors hover:text-harbor-deep">
          See how these numbers are calculated
          <span aria-hidden="true" className="ml-1.5">
            ↓
          </span>
        </summary>
        <dl className="mt-4 space-y-3.5 text-[13px] leading-relaxed text-ink-faint">
          <div>
            <dt className="font-medium text-ink-soft">Which date a booking counts on</dt>
            <dd>
              The day the guest made the reservation, not the day they arrive. A
              booking made in June for an August stay counts in June.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink-soft">Which marketing gets the credit</dt>
            <dd>
              The last campaign the traveler engaged with before booking — last-touch
              attribution. A booking is never counted twice across campaigns.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink-soft">Reporting period</dt>
            <dd>
              {longDate(range.from, timezone)} to {longDate(range.to, timezone)},
              compared with {comparisonPeriodLabel(range)}. Days are counted in your
              hotel&apos;s own time zone, and the advertising figures cover exactly the
              same window as the booking figures.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink-soft">What is not included</dt>
            <dd>
              These figures do not include reservations that came through
              Booking.com, Expedia or other travel sites, walk-ins and phone
              bookings, or direct bookings Autumn cannot connect to its marketing.
              Your hotel&apos;s total business is larger than what this page shows.
            </dd>
          </div>
        </dl>
      </details>
    </div>
  );
}
