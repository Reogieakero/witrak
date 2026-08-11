export type ScopedSection = {
  name: string;
  programYear: { level: number; program: { code: string } };
};

export type ScopedYearLevel = {
  level: number;
  program: { code: string };
};

export type TrendPoint = { x: number; y: number; rate: number };

export function shortName(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}. ${lastName}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}

export function monthLabel(key: string): string {
  return new Date(`${key}-01`).toLocaleDateString("en-PH", { month: "short" });
}

export function detailsRole(details: unknown): string {
  if (details && typeof details === "object" && "role" in details) {
    const role = (details as { role: unknown }).role;
    if (typeof role === "string") return role;
  }
  return "";
}

export function studentSectionLabel(s: { section: ScopedSection | null }): string {
  if (!s.section) return "Unassigned";
  return `${s.section.programYear.program.code} ${s.section.programYear.level}-${s.section.name}`;
}

export function scopeLabel(
  rr: {
    requestedScopeType: string;
    requestedSectionId: string | null;
    requestedProgramYearId: string | null;
  },
  sectionById: Map<string, ScopedSection>,
  yearById: Map<string, ScopedYearLevel>,
): string {
  if (rr.requestedScopeType === "SECTION" && rr.requestedSectionId) {
    const s = sectionById.get(rr.requestedSectionId);
    if (s) return `${s.programYear.program.code} ${s.programYear.level}-${s.name}`;
    return "Section";
  }
  if (rr.requestedScopeType === "PROGRAM_YEAR" && rr.requestedProgramYearId) {
    const y = yearById.get(rr.requestedProgramYearId);
    if (y) return `${y.program.code} ${y.level}`;
    return "Program year";
  }
  if (rr.requestedScopeType === "PROGRAM") return "Program";
  return "Faculty";
}

export function buildTrend(
  trend: [string, { present: number; total: number }][],
): { area: string; line: string; points: TrendPoint[] } {
  const W = 340;
  const H = 85;
  const TOP = 12;
  const n = trend.length;
  const points = trend.map(([, m], i) => {
    const rate = m.total ? (m.present / m.total) * 100 : 0;
    const x = n === 1 ? 0 : Math.round((i / (n - 1)) * W);
    const y = Math.round(TOP + ((100 - rate) / 100) * (H - TOP));
    return { x, y, rate };
  });
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  return { area, line, points };
}
