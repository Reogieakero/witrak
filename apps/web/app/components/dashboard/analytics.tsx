"use client";

import { useState } from "react";
import { BarChart2, BarChart3, HandCoins, TrendingUp } from "lucide-react";
import { FeeDonutChart } from "@/app/components/dashboard/fee-donut-chart";
import { EventTrendChart } from "@/app/components/dashboard/event-trend-chart";
import type { EventTrendPoint } from "@/app/components/dashboard/event-trend-chart";
import { SectionPerformanceChart } from "@/app/components/dashboard/section-performance-chart";
import type { ProgramBar } from "@/app/components/dashboard/section-performance-chart";
import { Badge } from "@/app/components/ui/badge";
import { Select } from "@/app/components/ui/select";
import type { SelectOption } from "@/app/components/ui/select";
import styles from "./analytics.module.css";

type EventPerformance = {
  id: string;
  title: string;
  bars: ProgramBar[];
};

type AnalyticsProps = {
  termName: string;
  eventTrend: EventTrendPoint[];
  collected: number;
  totalFee: number;
  collectedRate: number;
  eventPerformance: EventPerformance[];
};

export function Analytics({
  termName,
  eventTrend,
  collected,
  totalFee,
  collectedRate,
  eventPerformance,
}: AnalyticsProps) {
  const [eventId, setEventId] = useState(eventPerformance[0]?.id ?? "");
  const selectedEvent =
    eventPerformance.find((e) => e.id === eventId) ?? eventPerformance[0];
  const eventOptions: SelectOption[] = eventPerformance.map((e) => ({
    value: e.id,
    label: e.title,
  }));

  return (
    <div className={`${styles.panel} ${styles.analyticsPanel}`}>
      <div className={styles.analyticsHeader}>
        <div>
          <h3 className={styles.analyticsTitle}>
            <BarChart3 size={16} />
            Attendance Analytics
          </h3>
          <p className={styles.analyticsSub}>
            Comprehensive view of event attendance trends, section heatmap, and breakdowns
          </p>
        </div>
        <Badge tone="brand">{termName}</Badge>
      </div>

      <div className={styles.analyticsBody}>
        <div className={styles.chartGrid2}>
          <div className={styles.chartPanel}>
            <div className={styles.chartPanelHeader}>
              <div>
                <h4 className={styles.chartPanelTitle}>
                  <TrendingUp size={14} />
                  Event Attendance Trend
                </h4>
                <p className={styles.chartPanelSub}>
                  Present, absent, and late counts per event ({eventTrend.length}{" "}
                  {eventTrend.length === 1 ? "Event" : "Events"})
                </p>
              </div>
            </div>

            {eventTrend.length === 0 ? (
              <p className={styles.emptyText}>No attendance recorded yet.</p>
            ) : (
              <EventTrendChart data={eventTrend} />
            )}

            <div className={styles.chartLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDotBrand} />
                Present / Absent / Late
              </span>
            </div>
          </div>

          <div className={styles.chartPanel}>
            <div className={styles.chartPanelHeader}>
              <div>
                <h4 className={styles.chartPanelTitle}>
                  <HandCoins size={14} />
                  Fee Collection vs Target
                </h4>
                <p className={styles.chartPanelSub}>
                  Collected fees compared against the overall target for {termName}
                </p>
              </div>
              <span className={styles.chartPeak}>{collectedRate}% of target</span>
            </div>

            <FeeDonutChart collected={collected} target={totalFee} />
          </div>
        </div>

          <div className={styles.chartPanel}>
            <div className={styles.chartPanelHeader}>
              <div>
                <h4 className={styles.chartPanelTitle}>
                  <BarChart2 size={14} />
                  Section Performance Breakdown
                </h4>
                <p className={styles.chartPanelSub}>
                  Present count per year program for the selected event
                </p>
              </div>
              <div className={styles.chartSelectWrap}>
                <Select
                  name="eventPerformance"
                  value={eventId}
                  placeholder="Select event"
                  options={eventOptions}
                  onChange={setEventId}
                />
              </div>
            </div>

            {!selectedEvent || selectedEvent.bars.length === 0 ? (
              <p className={styles.emptyText}>No attendance recorded yet.</p>
            ) : (
              <SectionPerformanceChart data={selectedEvent.bars} />
            )}

            <div className={styles.chartFooter}>
              <span className={styles.legendItem}>
                <span className={styles.legendDotBrand} />
                Present Count
              </span>
              <span className={styles.chartFooterNote}>Hover bars to view exact counts</span>
            </div>
          </div>
      </div>

      <p className={styles.analyticsNote}>
        Data is aggregated from QR event attendance logs across all sections for {termName}.
        Figures update automatically at the end of each event and are used to flag at-risk students
        and sections falling below the 95% target.
      </p>
    </div>
  );
}
