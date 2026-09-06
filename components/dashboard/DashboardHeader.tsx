import Link from "next/link";
import { longDate } from "@/lib/analytics/format";
import type { DateRange } from "@/types/analytics";
import type { Property } from "@/types/database";
import { RangeSelector } from "./RangeSelector";

/**
 * Masthead. It names the property and the period, and nothing else — room
 * count and comparison wording moved to where they actually help.
 */
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
    <header className="border-b border-rule/70">
      <div className="mx-auto w-full max-w-[1200px] px-6 pb-7 pt-6 sm:px-10 sm:pb-9 sm:pt-8">
        <div className="flex items-baseline gap-3">
          <span className="spoken text-[20px] text-harbor">Autumn</span>
          <span aria-hidden="true" className="text-rule-strong">
            /
          </span>
          {breadcrumb ? (
            <Link
              href={breadcrumb.href}
              className="text-[13px] text-ink-soft transition-colors hover:text-harbor"
            >
              Marketing
            </Link>
          ) : (
            <span className="text-[13px] text-ink-soft">
              {property.name}, {property.city}
            </span>
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <h1 className="text-[27px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[32px]">
            {title}
          </h1>

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
