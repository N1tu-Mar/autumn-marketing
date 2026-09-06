import type { DateRange } from "@/types/analytics";

/** Footer-weight trust note. Says what is counted, and what is not. */
export function AttributionExplainer({ range }: { range: DateRange }) {
  return (
    <div className="max-w-prose text-[13px] leading-relaxed text-ink-faint">
      <p className="font-medium text-ink-soft">How booking attribution works</p>
      <p className="mt-1.5">
        These are direct bookings on your own website that Autumn can connect to
        marketing for this property, credited to the last campaign the guest
        engaged with. Bookings are counted on the day the guest booked rather
        than the day they arrive, using dates local to the property, over the
        same window as the marketing figures ({range.label.toLowerCase()}).
        Direct bookings Autumn cannot connect to a campaign are left out.
      </p>
    </div>
  );
}
