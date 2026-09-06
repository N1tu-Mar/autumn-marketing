import type {
  AutumnAction,
  CampaignPerformanceRow,
  FeederMarketRow,
  Property,
  TrendRow,
} from "./database";

export type RangeKey = "last_30" | "last_90" | "ytd" | "last_12m" | "custom";

export type DateRange = {
  key: RangeKey;
  /** Inclusive, YYYY-MM-DD, in the property's timezone. */
  from: string;
  to: string;
  label: string;
  /** Same span, one year earlier. */
  comparison: { from: string; to: string; label: string };
  /** Chart bucketing chosen from the span length. */
  grain: "day" | "week" | "month";
  days: number;
};

/** Everything the dashboard shows about one period, all derived from rows. */
export type PeriodMetrics = {
  impressions: number;
  clicks: number;
  websiteVisits: number;
  adSpend: number;
  bookings: number;
  bookingRevenue: number;
  roomNights: number;
  /** clicks / impressions — null when there were no impressions. */
  clickThroughRate: number | null;
  /** bookings / website visits — null when there were no visits. */
  bookingRate: number | null;
  /** revenue / bookings — null when there were no bookings. */
  averageBookingValue: number | null;
  /** revenue / spend — null when nothing was spent. */
  returnOnAdSpend: number | null;
  /** room nights / bookings — how long guests are staying. */
  averageStayNights: number | null;
};

/** A change between the current period and the same period last year. */
export type Delta = {
  current: number;
  previous: number;
  /** Relative change. Null when the prior period had nothing to compare to. */
  ratio: number | null;
  absolute: number;
  direction: "up" | "down" | "flat";
};

export type ComparedMetrics = {
  current: PeriodMetrics;
  previous: PeriodMetrics;
  revenue: Delta;
  bookings: Delta;
  websiteVisits: Delta;
  impressions: Delta;
  averageBookingValue: Delta;
  bookingRate: Delta;
  averageStayNights: Delta;
};

export type Insight = {
  id: string;
  tone: "concern" | "positive" | "neutral";
  title: string;
  detail: string;
};

export type MarketBreakdown = FeederMarketRow & {
  revenueShare: number;
  /** Year-over-year revenue change for this market, when comparable. */
  revenueDelta: Delta | null;
};

export type CampaignBreakdown = CampaignPerformanceRow & {
  revenueShare: number;
  clickThroughRate: number | null;
  bookingRate: number | null;
  averageBookingValue: number | null;
};

export type DashboardData = {
  property: Property;
  range: DateRange;
  dataThrough: string;
  metrics: ComparedMetrics;
  trend: { current: TrendRow[]; comparison: TrendRow[] };
  insights: Insight[];
  actions: AutumnAction[];
};

export type BookingsData = {
  property: Property;
  range: DateRange;
  dataThrough: string;
  metrics: ComparedMetrics;
  campaigns: CampaignBreakdown[];
  markets: MarketBreakdown[];
};
