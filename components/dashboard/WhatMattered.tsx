import type { Insight } from "@/types/analytics";

/**
 * One supporting observation about the period, stated as a fact rather than a
 * reading of it.
 */
export function WhatMattered({ secondary }: { secondary: Insight | null }) {
  if (!secondary) return null;

  return (
    <div className="max-w-[54ch]">
      <h3
        className={`text-[16px] font-semibold leading-snug ${
          secondary.tone === "concern" ? "text-clay" : "text-ink"
        }`}
      >
        {secondary.title}
      </h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">
        {secondary.detail}
      </p>
    </div>
  );
}
