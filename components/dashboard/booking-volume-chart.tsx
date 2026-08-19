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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DataPoint {
  date: string
  count: number
}

export function BookingVolumeChart({ data }: { data: DataPoint[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Bookings — Last 30 days
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {data.every((d) => d.count === 0) ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <p className="text-sm">No bookings in the last 30 days yet.</p>
              <p className="text-xs">
                Share your booking link to start receiving meetings.
              </p>
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
      </CardContent>
    </Card>
  )
}
