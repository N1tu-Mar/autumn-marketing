import type { AutumnNarrative } from "@/types/analytics";

/**
 * Autumn's reading of the period.
 *
 * Deliberately quiet: no border, no icon, no badge. It is the one place on the
 * screen where the product speaks in sentences, and it earns attention by
 * being the only thing shaped like prose.
 */
export function AutumnTake({ narrative }: { narrative: AutumnNarrative | null }) {
  if (!narrative) return null;

  return (
    <section aria-label="Autumn's take" className="max-w-[54ch]">
      <p className="eyebrow">Autumn&apos;s take</p>
      <h2
        className={`spoken mt-3 text-[26px] leading-[1.2] sm:text-[30px] ${
          narrative.tone === "watch" ? "text-clay" : "text-ink"
        }`}
      >
        {narrative.headline}
      </h2>
      <p className="mt-3.5 text-[15px] leading-[1.65] text-ink-soft">
        {narrative.body}
      </p>
    </section>
  );
}
