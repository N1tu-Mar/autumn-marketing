import type { CampaignType } from "@/types/database";

/**
 * Product language, not data. Campaign names and types come from the database;
 * these are the plain-English explanations shown beside them.
 */
/**
 * Guest behaviour is the primary label; the industry term stays as the
 * secondary one. An owner recognises "already looking for you" long before
 * they recognise "brand protection", but the technical name still has to be
 * visible so the two vocabularies stay connected.
 */
export const CAMPAIGN_COPY: Record<
  CampaignType,
  {
    /** Reads as the subject of a sentence in Autumn's take. */
    sourcePhrase: string;
    guestLabel: string;
    label: string;
    description: string;
  }
> = {
  brand_protection: {
    sourcePhrase: "Travelers already searching for you by name",
    guestLabel: "Already looking for you",
    label: "Brand Protection",
    description:
      "Travelers searching for your property or brand by name.",
  },
  discovery: {
    sourcePhrase: "Travelers discovering you while comparing places to stay",
    guestLabel: "Discovering your property",
    label: "Discovery & Competitors",
    description:
      "Travelers finding your hotel while exploring or comparing alternatives.",
  },
  metasearch: {
    sourcePhrase: "Travelers comparing rates inside travel search",
    guestLabel: "Comparing places to stay",
    label: "Metasearch",
    description:
      "High-intent travelers seeing your hotel inside travel-search and rate-comparison experiences.",
  },
  retargeting: {
    sourcePhrase: "Travelers returning after an earlier visit",
    guestLabel: "Coming back after looking before",
    label: "Retargeting",
    description:
      "Travelers who previously showed interest and were encouraged to return.",
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
