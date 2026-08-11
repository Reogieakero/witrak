"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./event-trend-chart.module.css";

export type EventTrendPoint = { name: string; rate: number };

export function EventTrendChart({ data }: { data: EventTrendPoint[] }) {
  return (
    <div className={styles.wrap}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
            axisLine={{ stroke: "var(--border-default)" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "var(--text-faint)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            wrapperStyle={{ zIndex: 9999 }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border-default)",
              fontSize: 12,
              color: "var(--text-strong)",
              backgroundColor: "var(--surface-card)",
              boxShadow: "0 4px 12px rgba(16, 24, 40, 0.1)",
              zIndex: 9999,
            }}
            itemStyle={{ color: "#2563eb", fontWeight: 600 }}
            labelStyle={{ color: "var(--text-muted)", fontWeight: 600 }}
            formatter={(value) => `${value}%`}
          />
          <Line
            type="natural"
            dataKey="rate"
            name="Attendance Rate"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#fff", stroke: "#2563eb", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
