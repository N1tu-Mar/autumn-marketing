import type { DateRange, Delta } from "@/types/analytics";
import { signedPercent } from "@/lib/analytics/format";

/**
 * One home for how every metric is named to the customer.
 *
 * `label` is what the hotel owner reads. `technicalLabel` is the industry name,
 * kept so a GM or an agency can still reconcile the screen with an ad platform,
 * but never used on its own. `help` explains the label in a sentence — it is
 * support for a label that already makes sense, not a substitute for one.
 */
export const METRIC_LANGUAGE = {
  impressions: {
    label: "Times your ads were shown",
    shortLabel: "Ad appearances",
    technicalLabel: "Impressions",
    help: "How many times one of your ads appeared to a traveler. This counts ad appearances, not people — one traveler can see an ad several times.",
  },
  clicks: {
    label: "Clicks to learn more",
    shortLabel: "Ad clicks",
    technicalLabel: "Clicks",
    help: "How many times a traveler clicked one of your ads after seeing it.",
  },
  websiteVisits: {
    label: "Visits to your website",
    shortLabel: "Website visits",
    technicalLabel: "Sessions",
    help: "Visits that reached your own website after a traveler clicked an Autumn ad. Some clicks never finish loading the page, so this is lower than clicks.",
  },
  clickThroughRate: {
    label: "Ad views that led to a click",
    shortLabel: "Led to a click",
    technicalLabel: "Click-through rate (CTR)",
    help: "Out of every 100 times an ad appeared, this is how many led to a click.",
  },
  bookingRate: {
    label: "Visitors who booked",
    shortLabel: "Visitors who booked",
    technicalLabel: "Conversion rate (CVR)",
    help: "Out of travelers who reached your website from this marketing, this is the share who completed a direct reservation.",
  },
  bookings: {
    label: "Direct bookings",
    shortLabel: "Direct bookings",
    technicalLabel: null,
    help: "Reservations made on your own website that Autumn can connect to its marketing.",
  },
  bookingRevenue: {
    label: "Direct booking revenue",
    shortLabel: "Booking revenue",
    technicalLabel: null,
    help: "The value of the direct reservations Autumn connected to this marketing.",
  },
  adSpend: {
    label: "Advertising spend",
    shortLabel: "Ad spend",
    technicalLabel: null,
    help: "What was spent on advertising for your hotel during this period.",
  },
  returnOnAdSpend: {
    label: "Booking revenue for every $1 spent",
    shortLabel: "For every $1 spent",
    technicalLabel: "Return on ad spend (ROAS)",
    help: "Direct booking revenue divided by advertising spend.",
  },
  averageBookingValue: {
    label: "Average booking value",
    shortLabel: "Average booking",
    technicalLabel: null,
    help: "Direct booking revenue divided by the number of bookings.",
  },
} as const;

/* ----------------------------------------------------------- comparisons -- */

/**
 * Hotels are seasonal, so every comparison on both screens is against the same
 * calendar window a year earlier. Naming the window in words — "the same 30
 * days last year" — is the difference between a number the owner trusts and a
 * number they have to interrogate.
 */
export function comparisonPeriodLabel(range: DateRange): string {
  switch (range.key) {
    case "last_30":
      return "the same 30 days last year";
    case "last_90":
      return "the same 90 days last year";
    case "last_12m":
      return "the 12 months before that";
    default:
      return "the same period last year";
  }
}

/**
 * "18% more booking revenue than the same 30 days last year."
 *
 * Returns null when last year has nothing to compare against, so callers show
 * no comparison rather than a misleading zero.
 */
export function comparisonSentence(
  delta: Delta,
  range: DateRange,
  noun: string,
): string | null {
  if (delta.ratio === null) return null;

  const period = comparisonPeriodLabel(range);
  if (delta.direction === "flat") {
    return `About the same ${noun} as ${period}.`;
  }

  const size = signedPercent(delta.ratio).replace(/^[+−]/, "");
  return `${size} ${delta.direction === "up" ? "more" : "less"} ${noun} than ${period}.`;
}

/** The same comparison where there is only room for a fragment. */
export function comparisonShort(delta: Delta, range: DateRange): string | null {
  if (delta.ratio === null) return null;
  const size = signedPercent(delta.ratio).replace(/^[+−]/, "");
  if (delta.direction === "flat") return `About level with ${comparisonPeriodLabel(range)}`;
  return `${size} ${delta.direction === "up" ? "more" : "less"} than ${comparisonPeriodLabel(range)}`;
}
