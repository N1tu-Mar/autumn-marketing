import { AutumnTake } from "./AutumnTake";
import type { AutumnNarrative, Insight } from "@/types/analytics";

/**
 * One conclusion, one supporting observation. The take does the interpreting;
 * the observation adds a second fact rather than restating the first.
 */
export function WhatMattered({
  narrative,
  secondary,
}: {
  narrative: AutumnNarrative | null;
  secondary: Insight | null;
}) {
  if (!narrative && !secondary) return null;

  return (
    <div>
      <AutumnTake narrative={narrative} />

      {secondary ? (
        <div className="mt-9 max-w-[54ch] border-t border-rule/60 pt-7">
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
      ) : null}
    </div>
  );
}
