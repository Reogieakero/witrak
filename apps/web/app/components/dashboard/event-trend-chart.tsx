"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./event-trend-chart.module.css";

export type EventTrendPoint = {
  name: string;
  present: number;
  absent: number;
  late: number;
};

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
            allowDecimals={false}
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
            labelStyle={{ color: "var(--text-muted)", fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="natural"
            dataKey="present"
            name="Present"
            stroke="#16a34a"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#fff", stroke: "#16a34a", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="natural"
            dataKey="absent"
            name="Absent"
            stroke="#ef4444"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#fff", stroke: "#ef4444", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="natural"
            dataKey="late"
            name="Late"
            stroke="#f59e0b"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#fff", stroke: "#f59e0b", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
