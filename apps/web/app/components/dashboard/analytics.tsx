import { BarChart2, BarChart3, CalendarDays, TrendingUp } from "lucide-react";
import { DAY_KEYS } from "@/lib/constants/dashboard";
import { buildTrend, monthLabel } from "@/lib/dashboard-utils";
import styles from "./analytics.module.css";

export type AnalyticsTrend = [string, { present: number; total: number }][];
export type HeatRow = { label: string; days: number[] };
export type SectionBar = { label: string; rate: number };

type AnalyticsProps = {
  termName: string;
  presentRate: number;
  monthCount: number;
  chartTrend: AnalyticsTrend;
  topHeat: HeatRow[];
  sectionBars: SectionBar[];
};

function heatShade(rate: number): string {
  if (rate >= 95) return styles.heatHigh;
  if (rate >= 90) return styles.heatMid;
  if (rate >= 85) return styles.heatLow;
  return styles.heatFaint;
}

function barOpacity(rate: number): number {
  if (rate >= 96) return 1;
  if (rate >= 93) return 0.85;
  if (rate >= 90) return 0.75;
  return 0.65;
}

export function Analytics({
  termName,
  presentRate,
  monthCount,
  chartTrend,
  topHeat,
  sectionBars,
}: AnalyticsProps) {
  const { area, line, points } = buildTrend(chartTrend);

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
        <span className={styles.badgeBrand}>{termName}</span>
      </div>

      <div className={styles.analyticsBody}>
        <div className={styles.chartGrid2}>
          <div className={styles.chartPanel}>
            <div className={styles.chartPanelHeader}>
              <div>
                <h4 className={styles.chartPanelTitle}>
                  <TrendingUp size={14} />
                  Monthly Attendance Trend
                </h4>
                <p className={styles.chartPanelSub}>
                  Average Rate: {presentRate}% ({monthCount} {monthCount === 1 ? "Month" : "Months"})
                </p>
              </div>
              <a href="#" className={styles.chartPanelLink}>
                Report
              </a>
            </div>

            {points.length === 0 ? (
              <p className={styles.emptyText}>No attendance recorded yet.</p>
            ) : (
              <div className={styles.svgWrap}>
                <svg viewBox="0 0 340 100" className={styles.trendSvg}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="10" x2="340" y2="10" className={styles.gridLine} />
                  <line x1="0" y1="35" x2="340" y2="35" className={styles.gridLine} />
                  <line x1="0" y1="60" x2="340" y2="60" className={styles.gridLine} />
                  <line x1="0" y1="85" x2="340" y2="85" className={styles.gridLineBase} />
                  <line x1="0" y1="25" x2="340" y2="25" className={styles.targetLine} />
                  <path d={area} fill="url(#trendGradient)" />
                  <path
                    d={line}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {points.map((p) => (
                    <circle
                      key={p.x}
                      cx={p.x}
                      cy={p.y}
                      r="3"
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth="2"
                    />
                  ))}
                </svg>
                <div className={styles.trendLabels}>
                  {chartTrend.map(([key]) => (
                    <span key={key}>{monthLabel(key)}</span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.chartLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDotBrand} />
                Monthly Rate
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
                  <CalendarDays size={14} />
                  Section Attendance Heatmap
                </h4>
                <p className={styles.chartPanelSub}>
                  Weekly event log intensity by section (Mon – Fri)
                </p>
              </div>
              <span className={styles.chartPeak}>
                {topHeat.length ? `${Math.max(...topHeat.map((t) => Math.max(...t.days)))}% peak` : "—"}
              </span>
            </div>

            <div className={styles.heatWrap}>
              {topHeat.length === 0 ? (
                <p className={styles.emptyText}>No attendance recorded yet.</p>
              ) : (
                <>
                  <div className={styles.heatDays}>
                    {DAY_KEYS.map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>
                  <div className={styles.heatCols}>
                    {topHeat.map((s) => (
                      <div key={s.label} className={styles.heatCol}>
                        <div className={styles.heatCells}>
                          {s.days.map((rate, i) => (
                            <span
                              key={i}
                              className={`${styles.heatCell} ${heatShade(rate)}`}
                              title={`${DAY_KEYS[i]}: ${rate}%`}
                            />
                          ))}
                        </div>
                        <span className={styles.heatLabel}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className={styles.heatLegend}>
              <span>Mon – Fri event logs</span>
              <span className={styles.heatScale}>
                Less
                <span className={styles.heatFaint} />
                <span className={styles.heatLow} />
                <span className={styles.heatMid} />
                <span className={styles.heatHigh} />
                More
              </span>
            </div>
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
                Section attendance rate comparison with angled X-axis section labels
              </p>
            </div>
            <a href="#" className={styles.chartPanelLink}>
              View All
            </a>
          </div>

          {sectionBars.length === 0 ? (
            <p className={styles.emptyText}>No attendance recorded yet.</p>
          ) : (
            <div className={styles.barWrap}>
              <div className={styles.barChart}>
                <span className={styles.barGrid}>
                  <span className={styles.barGridLine} />
                  <span className={styles.barGridLine} />
                  <span className={styles.barGridLine} />
                  <span className={styles.barGridLine} />
                </span>
                {sectionBars.map((b) => (
                  <div key={b.label} className={styles.barCol}>
                    <span className={styles.barValue}>{b.rate}%</span>
                    <div
                      className={styles.barFill}
                      style={{ height: `${Math.max(b.rate, 4)}%`, opacity: barOpacity(b.rate) }}
                    />
                    <span className={styles.barLabel}>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
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
