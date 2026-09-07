import { AutumnActions } from "@/components/dashboard/AutumnActions";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WhatMattered } from "@/components/dashboard/WhatMattered";
import { PerformanceHero } from "@/components/dashboard/PerformanceHero";
import { PerformanceTrend } from "@/components/dashboard/PerformanceTrend";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { secondaryInsight } from "@/lib/analytics/narrative";
import { rangeQuery } from "@/lib/analytics/range";
import { getDashboardData } from "@/lib/data/overview";
import { NoDataError } from "@/lib/data/property";
import { SupabaseConfigError } from "@/lib/supabase/server";

// Every figure is read from Postgres on request, so editing a row in Supabase
// changes what this page renders on the next load.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Marketing performance — Autumn",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;

  let data;
  try {
    data = await getDashboardData(params);
  } catch (error) {
    if (error instanceof SupabaseConfigError || error instanceof NoDataError) {
      return <SetupNotice message={error.message} />;
    }
    throw error;
  }

  const { property, range, dataThrough, metrics, trend, insights, actions, narrative } =
    data;

  return (
    <div className="min-h-screen">
      <DashboardHeader
        property={property}
        range={range}
        dataThrough={dataThrough}
        title="Marketing performance"
      />

      <main className="mx-auto w-full max-w-[1200px] px-6 py-9 sm:px-10 sm:py-11">
        <PerformanceHero
          metrics={metrics}
          range={range}
          timezone={property.timezone}
          detailHref={`/dashboard/bookings${rangeQuery(range)}`}
        />

        <div className="mt-16 sm:mt-20">
          <PerformanceTrend
            title="Direct booking performance"
            current={trend.current}
            comparison={trend.comparison}
            grain={range.grain}
          />
        </div>

        <div className="mt-16 grid gap-14 border-t border-rule/70 pt-14 sm:mt-20 sm:pt-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-20">
          <WhatMattered
            narrative={narrative}
            secondary={secondaryInsight(narrative, insights)}
          />
          <AutumnActions actions={actions} timezone={property.timezone} />
        </div>
      </main>

      <footer className="mt-6 border-t border-rule/70">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-7 text-xs leading-relaxed text-ink-faint sm:px-10">
          Direct bookings Autumn can connect to its marketing, counted on the day
          each booking was made.
        </div>
      </footer>
    </div>
  );
}
