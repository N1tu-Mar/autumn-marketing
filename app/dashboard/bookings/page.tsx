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

      <main className="mx-auto w-full max-w-[1180px] space-y-6 px-5 py-7 sm:px-8 sm:py-8">
        <BookingSummary metrics={metrics} />
        <CampaignContribution campaigns={campaigns} />

        <div className="grid gap-6 lg:grid-cols-2">
          <FeederMarkets markets={markets} />
          <MarketingJourney metrics={metrics.current} />
        </div>

        <CampaignTable campaigns={campaigns} />
        <AttributionExplainer range={range} timezone={property.timezone} />
      </main>
    </div>
  );
}
