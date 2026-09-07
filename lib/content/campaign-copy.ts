import type { CampaignType } from "@/types/database";

/**
 * Product language, not data. Campaign names and types come from the database;
 * these are the plain-English explanations shown beside them.
 *
 * Guest behaviour is the primary label; the industry term stays as the
 * secondary one. An owner recognises "already looking for your hotel" long
 * before they recognise "brand protection", but the technical name still has
 * to be visible so the two vocabularies stay connected.
 */
export const CAMPAIGN_COPY: Record<
  CampaignType,
  {
    /** A real sentence subject, so headlines read as English. */
    subject: string;
    /** The short form used in ranked lists and table rows. */
    guestLabel: string;
    /** The industry name. Always secondary, never on its own. */
    label: string;
    description: string;
  }
> = {
  brand_protection: {
    subject: "Travelers already looking for your hotel",
    guestLabel: "Already looking for your hotel",
    label: "Brand Protection",
    description:
      "Keeps your direct website visible when travelers search for your hotel by name, so a booking site does not intercept a guest who already chose you.",
  },
  discovery: {
    subject: "Travelers deciding where to stay",
    guestLabel: "Still deciding where to stay",
    label: "Discovery & Competitors",
    description:
      "Introduces your hotel to travelers who are still choosing a town or a place to stay.",
  },
  metasearch: {
    subject: "Travelers comparing hotels and prices",
    guestLabel: "Comparing hotels and prices",
    label: "Metasearch",
    description:
      "Shows your direct booking option while travelers compare hotels and rates side by side.",
  },
  retargeting: {
    subject: "Travelers who came back for another look",
    guestLabel: "Came back for another look",
    label: "Retargeting",
    description:
      "Reconnects with travelers who looked at your hotel earlier but had not booked yet.",
  },
};
