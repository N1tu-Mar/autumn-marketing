import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AttributionExplainer } from "@/components/bookings/AttributionExplainer";
import { BookingSummary } from "@/components/bookings/BookingSummary";
import { CampaignContribution } from "@/components/bookings/CampaignContribution";
import { CampaignTable } from "@/components/bookings/CampaignTable";
import { FeederMarkets } from "@/components/bookings/FeederMarkets";
import { MarketingJourney } from "@/components/bookings/MarketingJourney";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { rangeQuery } from "@/lib/analytics/range";
import { getBookingsData } from "@/lib/data/bookings";
import { NoDataError } from "@/lib/data/property";
import { SupabaseConfigError } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "What's driving your bookings — Autumn",
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

  return (
    <div className="min-h-screen">
      <DashboardHeader
        property={property}
        range={range}
        dataThrough={dataThrough}
        title="What's driving your bookings"
        breadcrumb={{
          href: `/dashboard${rangeQuery(range)}`,
          label: "Booking performance",
        }}
      />

      <main className="mx-auto w-full max-w-[1200px] px-6 py-9 sm:px-10 sm:py-11">
        <BookingSummary metrics={metrics} />

        <div className="mt-14 sm:mt-16">
          <CampaignContribution campaigns={campaigns} />
        </div>

        <div className="mt-14 grid gap-14 border-t border-rule/70 pt-14 sm:mt-16 sm:pt-16 lg:grid-cols-2 lg:gap-16">
          <FeederMarkets markets={markets} />
          <MarketingJourney metrics={metrics.current} />
        </div>

        <div className="mt-14 sm:mt-16">
          <CampaignTable campaigns={campaigns} />
        </div>

        <div className="mt-14 border-t border-rule/70 pt-8 sm:mt-16">
          <AttributionExplainer range={range} />
        </div>
      </main>
    </div>
  );
}
