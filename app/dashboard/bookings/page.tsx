import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AttributionExplainer } from "@/components/bookings/AttributionExplainer";
import { BookingSummary } from "@/components/bookings/BookingSummary";
import { CampaignTable } from "@/components/bookings/CampaignTable";
import { FeederMarkets } from "@/components/bookings/FeederMarkets";
import { LeadingStrategy } from "@/components/bookings/LeadingStrategy";
import { MarketingJourney } from "@/components/bookings/MarketingJourney";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { rangeQuery } from "@/lib/analytics/range";
import { getBookingsData } from "@/lib/data/bookings";
import { NoDataError } from "@/lib/data/property";
import { SupabaseConfigError } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "What's driving your bookings · Autumn",
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;

  let data;
  try {
    data = await getBookingsData(params);
  } catch (error) {
    if (error instanceof SupabaseConfigError || error instanceof NoDataError) {
      return <SetupNotice message={error.message} />;
    }
    throw error;
  }

  const { property, range, dataThrough, metrics, campaigns, markets } = data;
  const propertyName = property.short_name ?? property.name;

  return (
    <div className="min-h-screen">
      <DashboardHeader
        property={property}
        range={range}
        dataThrough={dataThrough}
        title="What's driving your bookings"
        breadcrumb={{
          href: `/dashboard${rangeQuery(range)}`,
          parentLabel: "Your direct bookings",
          currentLabel: "What's driving them",
        }}
      />

      {/*
        The page alternates loud and quiet on purpose: outcome, then the
        strategy that produced it, then the market it came from, then the
        mechanics, then everything technical folded away.
      */}
      <main className="mx-auto w-full max-w-[1200px] px-6 py-10 sm:px-10 sm:py-12">
        <BookingSummary
          metrics={metrics}
          range={range}
          propertyName={propertyName}
        />

        <div className="mt-16 border-t border-rule/70 pt-14 sm:mt-20 sm:pt-16">
          <LeadingStrategy campaigns={campaigns} />
        </div>

        <div className="mt-16 border-t border-rule/70 pt-14 sm:mt-20 sm:pt-16">
          <FeederMarkets markets={markets} range={range} />
        </div>

        <div className="mt-16 max-w-2xl border-t border-rule/70 pt-14 sm:mt-20 sm:pt-16">
          <MarketingJourney metrics={metrics.current} propertyName={propertyName} />
        </div>

        <div className="mt-14 sm:mt-16">
          <CampaignTable campaigns={campaigns} />
        </div>

        <div className="mt-14 border-t border-rule/70 pt-8 sm:mt-16">
          <AttributionExplainer range={range} timezone={property.timezone} />
        </div>
      </main>
    </div>
  );
}
