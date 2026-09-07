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
 * distinguishable without color, and a written summary underneath says what
 * the shape adds up to for anyone who cannot read the shape.
 */

type Metric = "revenue" | "bookings";

const METRIC_COPY: Record<Metric, { toggle: string; title: string; noun: string }> = {
  revenue: {
    toggle: "Booking revenue",
    title: "Direct booking revenue compared with last year",
    noun: "in direct booking revenue",
  },
  bookings: {
    toggle: "Bookings",
    title: "Direct bookings compared with last year",
    noun: "direct bookings",
  },
};

export function PerformanceTrend({
  current,
  comparison,
  grain,
}: {
  current: TrendRow[];
  comparison: TrendRow[];
  grain: DateRange["grain"];
}) {
  const [metric, setMetric] = useState<Metric>("revenue");
  const copy = METRIC_COPY[metric];

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
          {copy.title}
        </h2>
        <p className="py-10 text-sm text-ink-soft">
          No direct bookings were connected to Autumn marketing in this period, so
          there is nothing to chart yet.
        </p>
      </section>
    );
  }

  // The same conclusion the lines draw, written out: it is the accessible
  // description of the chart, and it is also what most people want from it.
  const totals = data.reduce(
    (acc, point) => ({
      current: acc.current + point.current,
      comparison:
        point.comparison === null ? acc.comparison : acc.comparison + point.comparison,
      comparable: acc.comparable || point.comparison !== null,
    }),
    { current: 0, comparison: 0, comparable: false },
  );

  // A prior year that sums to nothing is a period with no data to compare
  // against, not a real zero. The hero says so; this has to say the same.
  const summary =
    totals.comparable && totals.comparison > 0
      ? `${format(totals.current)} ${copy.noun} across this period, against ` +
        `${format(totals.comparison)} in the same period last year.`
      : `${format(totals.current)} ${copy.noun} across this period. There is no comparable period last year yet.`;

  return (
    <section>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <h2 className="max-w-[26ch] text-[22px] font-semibold leading-[1.25] tracking-[-0.015em] text-ink sm:max-w-none sm:text-[24px]">
          {copy.title}
        </h2>
        <div
          role="group"
          aria-label="Show booking revenue or bookings"
          className="inline-flex rounded-lg border border-rule p-0.5"
        >
          {(["revenue", "bookings"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={metric === option}
              onClick={() => setMetric(option)}
              className={`rounded-[6px] px-3 py-1.5 text-[13px] font-medium transition-colors ${
                metric === option
                  ? "bg-harbor-wash text-harbor-deep"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {METRIC_COPY[option].toggle}
            </button>
          ))}
        </div>
      </div>

      <figure className="m-0">
        <div className="h-[300px] w-full sm:h-[400px]" role="img" aria-label={summary}>
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

        <figcaption className="mt-4">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-soft">
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
          <p className="tnum mt-3 max-w-prose text-[14px] leading-relaxed text-ink-soft">
            {summary}
          </p>
        </figcaption>
      </figure>
    </section>
  );
}
