"use client"

import { Clock, CalendarDays } from "lucide-react"
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
  chartTooltipStyle,
  primaryWithOpacity,
} from "@/lib/chart-theme"

interface BusiestTimesData {
  byDayOfWeek: { day: string; count: number }[]
  byHourOfDay: { hour: number; count: number }[]
}

export function BusiestTimes({ data }: { data: BusiestTimesData }) {
  const totalBookings = data.byDayOfWeek.reduce((sum, d) => sum + d.count, 0)
  const hourData = data.byHourOfDay
    .filter((h) => h.count > 0)
    .map((h) => ({
      hour: `${h.hour.toString().padStart(2, "0")}:00`,
      count: h.count,
    }))

  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold">Busiest times</h2>
      {totalBookings === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Not enough booking data yet.
        </p>
      ) : (
        <div className="space-y-6">
          {/* Day of week */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              By day of week
            </p>
            <div className="flex gap-1.5">
              {data.byDayOfWeek.map((d) => {
                const maxDay = Math.max(
                  ...data.byDayOfWeek.map((x) => x.count),
                  1
                )
                const intensity = d.count / maxDay
                return (
                  <div
                    key={d.day}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div
                      className="w-full rounded transition-colors"
                      style={{
                        height: `${Math.max(intensity * 60, 4)}px`,
                        backgroundColor:
                          intensity > 0
                            ? primaryWithOpacity(Math.max(intensity, 0.15))
                            : CHART_COLORS.muted,
                      }}
                      title={`${d.day}: ${d.count} bookings`}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {d.day}
                    </span>
                    {d.count > 0 && (
                      <span className="text-[10px] font-medium">{d.count}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Time of day */}
          {hourData.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                By time of day
              </p>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hourData}
                    margin={{ top: 5, right: 0, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={CHART_COLORS.border}
                    />
                    <XAxis
                      dataKey="hour"
                      tick={{
                        fontSize: 10,
                        fill: CHART_COLORS.mutedForeground,
                      }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{
                        fontSize: 10,
                        fill: CHART_COLORS.mutedForeground,
                      }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={25}
                    />
                    <Tooltip
                      cursor={{ fill: CHART_COLORS.muted, opacity: 0.4 }}
                      contentStyle={{ ...chartTooltipStyle, fontSize: "12px" }}
                      formatter={(value) => [
                        `${Number(value)} booking${Number(value) !== 1 ? "s" : ""}`,
                      ]}
                    />
                    <Bar
                      dataKey="count"
                      fill={CHART_COLORS.primary}
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
