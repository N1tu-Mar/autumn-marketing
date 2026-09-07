import Link from "next/link";
import { longDate } from "@/lib/analytics/format";
import { comparisonPeriodLabel } from "@/lib/content/metric-language";
import { PropertyMark } from "@/components/ui/PropertyMark";
import { AutumnMark } from "@/components/ui/AutumnMark";
import type { DateRange } from "@/types/analytics";
import type { Property } from "@/types/database";
import { RangeSelector } from "./RangeSelector";

/**
 * The masthead names the hotel before it names the report. The dashboard is
 * about one specific property, and leading with the place rather than with the
 * page title is most of what keeps it from reading as generic analytics.
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
  breadcrumb?: { href: string; parentLabel: string; currentLabel: string };
}) {
  return (
    <header className="border-b border-rule/70">
      <div className="mx-auto w-full max-w-[1200px] px-6 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-7">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <PropertyMark property={property} />
            <div>
              <p className="text-[15px] font-semibold leading-tight text-ink">
                {property.name}
              </p>
              <p className="text-[13px] text-ink-soft">
                {property.city}
                {property.state ? `, ${property.state}` : ""}
              </p>
            </div>
          </div>
          <AutumnMark className="pt-1" />
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            {breadcrumb ? (
              <nav aria-label="Breadcrumb" className="mb-2">
                <ol className="flex items-center gap-1.5 text-[13px] text-ink-soft">
                  <li>
                    <Link
                      href={breadcrumb.href}
                      className="rounded transition-colors hover:text-harbor"
                    >
                      {breadcrumb.parentLabel}
                    </Link>
                  </li>
                  <li aria-hidden="true" className="text-rule-strong">
                    /
                  </li>
                  <li className="text-ink">{breadcrumb.currentLabel}</li>
                </ol>
              </nav>
            ) : null}
            <h1 className="text-[27px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[32px]">
              {title}
            </h1>
          </div>

          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <RangeSelector value={range.key} customLabel={range.label} />
            <p className="text-xs leading-relaxed text-ink-faint sm:text-right">
              Compared with {comparisonPeriodLabel(range)}
              <span aria-hidden="true"> · </span>
              <span className="whitespace-nowrap">
                data through {longDate(dataThrough, property.timezone)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
