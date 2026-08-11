import { BarChart2, BarChart3, HandCoins, TrendingUp } from "lucide-react";
import { FeeDonutChart } from "@/app/components/dashboard/fee-donut-chart";
import { EventTrendChart } from "@/app/components/dashboard/event-trend-chart";
import type { EventTrendPoint } from "@/app/components/dashboard/event-trend-chart";
import { SectionPerformanceChart } from "@/app/components/dashboard/section-performance-chart";
import type { YearBar } from "@/app/components/dashboard/section-performance-chart";
import { Badge } from "@/app/components/ui/badge";
import styles from "./analytics.module.css";

type AnalyticsProps = {
  termName: string;
  presentRate: number;
  eventTrend: EventTrendPoint[];
  collected: number;
  totalFee: number;
  collectedRate: number;
  yearBars: YearBar[];
};

export function Analytics({
  termName,
  presentRate,
  eventTrend,
  collected,
  totalFee,
  collectedRate,
  yearBars,
}: AnalyticsProps) {
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
                  Average Rate: {presentRate}% ({eventTrend.length}{" "}
                  {eventTrend.length === 1 ? "Event" : "Events"})
                </p>
              </div>
              <a href="#" className={styles.chartPanelLink}>
                Report
              </a>
            </div>

            {eventTrend.length === 0 ? (
              <p className={styles.emptyText}>No attendance recorded yet.</p>
            ) : (
              <EventTrendChart data={eventTrend} />
            )}

            <div className={styles.chartLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDotBrand} />
                Event Rate
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendBar} />
                {presentRate}% Target
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
                Attendance rate by year level for each course (AB PolSci, BS Psychology, BS DevCom)
              </p>
            </div>
            <a href="#" className={styles.chartPanelLink}>
              View All
            </a>
          </div>

          {yearBars.length === 0 ? (
            <p className={styles.emptyText}>No attendance recorded yet.</p>
          ) : (
            <SectionPerformanceChart data={yearBars} />
          )}

          <div className={styles.chartFooter}>
            <span className={styles.legendItem}>
              <span className={styles.legendDotBrand} />
              Attendance Rate
            </span>
            <span className={styles.chartFooterNote}>Hover bars to view exact percentages</span>
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
