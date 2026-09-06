import { AutumnActions } from "@/components/dashboard/AutumnActions";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { PerformanceHero } from "@/components/dashboard/PerformanceHero";
import { PerformanceTrend } from "@/components/dashboard/PerformanceTrend";
import { Section } from "@/components/ui/Section";
import { SetupNotice } from "@/components/ui/SetupNotice";
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

  const { property, range, dataThrough, metrics, trend, insights, actions } = data;
  const detailHref = `/dashboard/bookings${rangeQuery(range)}`;

  return (
    <div className="min-h-screen">
      <DashboardHeader
        property={property}
        range={range}
        dataThrough={dataThrough}
        title="Marketing performance"
      />

      <main className="mx-auto w-full max-w-[1180px] space-y-6 px-5 py-7 sm:px-8 sm:py-8">
        <PerformanceHero metrics={metrics} range={range} detailHref={detailHref} />

        <Section
          eyebrow={`${range.label}, against the ${range.comparison.label}`}
          title="Direct booking performance"
        >
          <PerformanceTrend
            current={trend.current}
            comparison={trend.comparison}
            grain={range.grain}
            comparisonLabel="Same period last year"
          />
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <InsightsSection insights={insights} />
          <AutumnActions actions={actions} timezone={property.timezone} />
        </div>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto w-full max-w-[1180px] px-5 py-6 text-xs text-ink-faint sm:px-8">
          Figures cover direct bookings Autumn can connect to its marketing,
          counted on the date each booking was made, in {property.timezone.replace("_", " ")}.
        </div>
      </footer>
    </div>
  );
}
