"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { RANGE_OPTIONS } from "@/lib/analytics/range";
import type { RangeKey } from "@/types/analytics";

/**
 * The range lives in the URL, so every query on the server re-runs when it
 * changes and both screens can share the same window. A native select is
 * keyboard- and touch-operable without reimplementing a listbox.
 */
export function RangeSelector({
  value,
  customLabel,
}: {
  value: RangeKey;
  customLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="range" className="sr-only">
        Reporting period
      </label>
      <select
        id="range"
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value;
          startTransition(() => {
            router.push(`${pathname}?range=${next}`, { scroll: false });
          });
        }}
        className="appearance-none rounded-lg border border-rule bg-surface py-2 pl-3.5 pr-9 text-sm font-medium text-ink shadow-[0_1px_2px_rgba(34,40,43,0.04)] transition-colors hover:border-rule-strong disabled:opacity-60"
      >
        {value === "custom" ? (
          <option value="custom">{customLabel ?? "Custom range"}</option>
        ) : null}
        {RANGE_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 text-ink-faint"
      >
        ▾
      </span>
    </div>
  );
}
