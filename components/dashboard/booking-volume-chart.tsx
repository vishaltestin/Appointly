"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  CHART_COLORS,
  chartAxisTick,
  chartTooltipStyle,
} from "@/lib/chart-theme"

interface DataPoint {
  date: string
  count: number
}

export function BookingVolumeChart({ data }: { data: DataPoint[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold">Bookings — Last 30 days</h2>
      <div className="h-64">
        {data.every((d) => d.count === 0) ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No bookings in the last 30 days yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.border}
              />
              <XAxis
                dataKey="date"
                tick={chartAxisTick}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={chartAxisTick}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                domain={[0, Math.max(maxCount, 1)]}
              />
              <Tooltip
                cursor={{ fill: CHART_COLORS.muted, opacity: 0.4 }}
                contentStyle={chartTooltipStyle}
                formatter={(value) => [
                  `${Number(value)} booking${Number(value) !== 1 ? "s" : ""}`,
                  "Bookings",
                ]}
              />
              <Bar
                dataKey="count"
                fill={CHART_COLORS.primary}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
