export type ScopedSection = {
  name: string;
  programYear: { level: number; program: { code: string } };
};

export type ScopedYearLevel = {
  level: number;
  program: { code: string };
};

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

