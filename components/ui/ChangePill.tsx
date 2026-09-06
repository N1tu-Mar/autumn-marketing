import { signedPercent } from "@/lib/analytics/format";
import type { Delta } from "@/types/analytics";

/**
 * A comparison against the same period last year.
 *
 * Direction is carried by an arrow glyph as well as by color, and an
 * incomparable period reads as "no comparison" rather than as 0%.
 */
export function ChangePill({
  delta,
  suffix = "vs same period last year",
  size = "base",
  invertTone = false,
}: {
  delta: Delta;
  suffix?: string;
  size?: "base" | "sm";
  invertTone?: boolean;
}) {
  if (delta.ratio === null) {
    return (
      <span className="text-ink-faint">
        No comparable data for {suffix.replace(/^vs /, "")}
      </span>
    );
  }

  const good = invertTone ? delta.direction === "down" : delta.direction === "up";
  const tone =
    delta.direction === "flat"
      ? "text-ink-soft"
      : good
        ? "text-harbor"
        : "text-clay";
  const arrow = delta.direction === "flat" ? "→" : delta.direction === "up" ? "↑" : "↓";

  return (
    <span className={size === "sm" ? "text-xs" : "text-sm"}>
      <span className={`${tone} font-semibold tnum whitespace-nowrap`}>
        <span aria-hidden="true">{arrow} </span>
        {signedPercent(delta.ratio)}
      </span>{" "}
      <span className="text-ink-soft">{suffix}</span>
    </span>
  );
}
