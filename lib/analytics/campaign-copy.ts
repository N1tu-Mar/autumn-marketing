import type { CampaignType } from "@/types/database";

/**
 * Product language, not data. Campaign names and types come from the database;
 * these are the plain-English explanations shown beside them.
 */
export const CAMPAIGN_COPY: Record<CampaignType, { label: string; description: string }> = {
  brand_protection: {
    label: "Brand Protection",
    description:
      "Ads shown to travelers already searching for your hotel or brand by name.",
  },
  discovery: {
    label: "Discovery & Competitors",
    description:
      "Ads that help travelers discover your property while they compare places to stay.",
  },
  metasearch: {
    label: "Metasearch",
    description:
      "Your listing shown inside travel search and rate-comparison sites, where intent is high.",
  },
  retargeting: {
    label: "Retargeting",
    description:
      "Ads that reconnect with travelers who already looked at your property.",
  },
};

export const METRIC_HELP = {
  impressions: "How many times your hotel's Autumn ads were shown.",
  clicks: "How many times a traveler clicked one of those ads.",
  websiteVisits:
    "Visits to your own website that came from an Autumn ad. Some clicks never load the page, so this is lower than clicks.",
  clickThroughRate: "The share of ad appearances that led to an ad click.",
  bookingRate:
    "The share of Autumn-driven website visits that became a direct booking.",
  averageBookingValue: "Direct booking revenue divided by the number of bookings.",
  directBookings:
    "Bookings made on your own website that Autumn can connect to its marketing.",
  bookingRevenue: "The total value of those direct bookings.",
  returnOnAdSpend: "Direct booking revenue for every dollar of ad spend.",
} as const;
