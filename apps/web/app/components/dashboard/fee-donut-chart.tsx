"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { money } from "@/lib/constants/dashboard";
import styles from "./fee-donut-chart.module.css";

type FeeDonutChartProps = {
  collected: number;
  target: number;
};

export function FeeDonutChart({ collected, target }: FeeDonutChartProps) {
  const remaining = Math.max(target - collected, 0);
  const rate = target > 0 ? Math.round((collected / target) * 100) : 0;
  const data = [
    { name: "Collected", value: collected },
    { name: "Remaining", value: remaining },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.chartArea}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={88}
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              stroke="none"
            >
              <Cell fill="#2563eb" />
              <Cell fill="var(--border-default)" />
            </Pie>
            <Tooltip
              formatter={(value) => money.format(Number(value ?? 0))}
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
            />
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.center}>
          <span className={styles.centerRate}>{rate}%</span>
          <span className={styles.centerLabel}>collected</span>
        </div>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.dotCollected} />
          Collected {money.format(collected)}
        </span>
        <span className={styles.legendItem}>
          <span className={styles.dotRemaining} />
          Target {money.format(target)}
        </span>
      </div>
    </div>
  );
}
