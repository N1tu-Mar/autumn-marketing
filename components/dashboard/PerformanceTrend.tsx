"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { bucketLabel, count, currency } from "@/lib/analytics/format";
import type { DateRange } from "@/types/analytics";
import type { TrendRow } from "@/types/database";

/**
 * One chart, one question: is direct booking revenue heading the right way?
 *
 * Two series only — this period and the same period last year — because a
 * seasonal business cannot read a trend without its own prior year beside it.
 * The comparison line is dashed as well as lighter, so the two are still
 * distinguishable without color.
 */

type Metric = "revenue" | "bookings";

export function PerformanceTrend({
  title,
  current,
  comparison,
  grain,
}: {
  title: string;
  current: TrendRow[];
  comparison: TrendRow[];
  grain: DateRange["grain"];
}) {
  const [metric, setMetric] = useState<Metric>("revenue");

  const data = useMemo(
    () =>
      current.map((row, index) => {
        const prior = comparison[index];
        return {
          label: bucketLabel(row.bucket_start, grain),
          priorLabel: prior ? bucketLabel(prior.bucket_start, grain) : null,
          current:
            metric === "revenue" ? Number(row.booking_revenue) : Number(row.bookings),
          comparison: prior
            ? metric === "revenue"
              ? Number(prior.booking_revenue)
              : Number(prior.bookings)
            : null,
        };
      }),
    [current, comparison, grain, metric],
  );

  const format = (value: number) =>
    metric === "revenue" ? currency(value) : count(value);

  const axisFormat = (value: number) =>
    metric === "revenue"
      ? value >= 1000
        ? `$${Math.round(value / 1000)}k`
        : `$${Math.round(value)}`
      : count(value);

  if (data.length === 0) {
    return (
      <section>
        <h2 className="text-[22px] font-semibold tracking-[-0.015em] text-ink sm:text-[24px]">
          {title}
        </h2>
        <p className="py-10 text-sm text-ink-soft">
          No bookings were recorded in this period, so there is nothing to plot yet.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px] font-semibold tracking-[-0.015em] text-ink sm:text-[24px]">
          {title}
        </h2>
        <div
          role="group"
          aria-label="Chart metric"
          className="inline-flex rounded-lg border border-rule p-0.5"
        >
          {(["revenue", "bookings"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={metric === option}
              onClick={() => setMetric(option)}
              className={`rounded-[6px] px-3 py-1.5 text-[13px] font-medium capitalize transition-colors ${
                metric === option
                  ? "bg-harbor-wash text-harbor-deep"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -6 }}>
            <CartesianGrid stroke="#e7e2d8" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "#e7e2d8" }}
              tick={{ fill: "#8b9498", fontSize: 12 }}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={axisFormat}
              tickLine={false}
              axisLine={false}
              width={58}
              tick={{ fill: "#8b9498", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ stroke: "#d6cfc2", strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as (typeof data)[number];
                return (
                  <div className="rounded-lg border border-rule bg-surface px-3 py-2.5 text-xs shadow-[0_8px_24px_rgba(34,40,43,0.10)]">
                    <p className="font-semibold text-ink">{point.label}</p>
                    <p className="tnum mt-1.5 text-ink">
                      <span className="text-ink-soft">This period </span>
                      {format(point.current)}
                    </p>
                    {point.comparison !== null ? (
                      <p className="tnum mt-0.5 text-ink">
                        <span className="text-ink-soft">
                          {point.priorLabel ?? "Last year"}{" "}
                        </span>
                        {format(point.comparison)}
                      </p>
                    ) : null}
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="comparison"
              stroke="#b07d3c"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 3, fill: "#b07d3c" }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="current"
              stroke="#1c6660"
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 4, fill: "#1c6660" }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-soft">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-0.5 w-6 rounded bg-harbor" />
          This period
        </li>
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-0 w-6 border-t-2 border-dashed border-sand"
          />
          Same period last year
        </li>
      </ul>
    </section>
  );
}
