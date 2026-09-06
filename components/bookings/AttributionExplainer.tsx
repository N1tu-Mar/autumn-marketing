import type { DateRange } from "@/types/analytics";

/** Says plainly what is counted, and what is not. */
export function AttributionExplainer({
  range,
  timezone,
}: {
  range: DateRange;
  timezone: string;
}) {
  return (
    <aside className="card bg-surface-sunk/50 px-5 py-5 sm:px-6">
      <h2 className="text-[15px] font-semibold text-ink">
        How booking attribution works
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
        These are direct bookings on your own website that Autumn can connect to
        marketing activity for this property, credited to the last campaign the
        guest engaged with before booking. Bookings are counted on the date the
        guest booked — not the date they arrive — using {timezone.replace("_", " ")} dates,
        and marketing figures cover the same window ({range.label.toLowerCase()}).
        Direct bookings Autumn cannot connect to a campaign are excluded from
        every number on this page.
      </p>
    </aside>
  );
}
