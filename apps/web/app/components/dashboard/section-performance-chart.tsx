"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./section-performance-chart.module.css";

export type YearBar = { label: string; rate: number };

function barOpacity(rate: number): number {
  if (rate >= 96) return 1;
  if (rate >= 93) return 0.85;
  if (rate >= 90) return 0.75;
  return 0.65;
}

export function SectionPerformanceChart({ data }: { data: YearBar[] }) {
  return (
    <div className={styles.wrap}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "var(--text-muted)" }}
            axisLine={{ stroke: "var(--border-default)" }}
            tickLine={false}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={40}
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
          <Bar dataKey="rate" name="Attendance Rate" radius={[2, 2, 0, 0]} maxBarSize={28}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#2563eb" fillOpacity={barOpacity(entry.rate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
