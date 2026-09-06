import Link from "next/link";
import { longDate } from "@/lib/analytics/format";
import type { DateRange } from "@/types/analytics";
import type { Property } from "@/types/database";
import { RangeSelector } from "./RangeSelector";

/** Shared masthead. `breadcrumb` marks the detail screen as a drill-down. */
export function DashboardHeader({
  property,
  range,
  dataThrough,
  title,
  breadcrumb,
}: {
  property: Property;
  range: DateRange;
  dataThrough: string;
  title: string;
  breadcrumb?: { href: string; label: string };
}) {
  return (
    <header className="border-b border-rule bg-surface">
      <div className="mx-auto w-full max-w-[1180px] px-5 pb-6 pt-5 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <span className="spoken text-[19px] text-harbor">Autumn</span>
          <span className="text-xs text-ink-faint">
            {property.city}
            {property.state ? `, ${property.state}` : ""}
            {property.room_count ? ` · ${property.room_count} rooms` : ""}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div>
            {breadcrumb ? (
              <nav aria-label="Breadcrumb" className="mb-2">
                <ol className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <li>
                    <Link
                      href={breadcrumb.href}
                      className="rounded transition-colors hover:text-harbor"
                    >
                      Marketing
                    </Link>
                  </li>
                  <li aria-hidden="true" className="text-ink-faint">
                    /
                  </li>
                  <li className="text-ink">{breadcrumb.label}</li>
                </ol>
              </nav>
            ) : null}
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[30px]">
              {title}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">{property.name}</p>
          </div>

          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <RangeSelector value={range.key} customLabel={range.label} />
            <p className="text-xs text-ink-faint">
              Data through {longDate(dataThrough, property.timezone)}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
