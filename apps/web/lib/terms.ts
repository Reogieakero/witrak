import { cookies } from "next/headers";
import { prisma } from "@fhusocom/db";

export const SELECTED_TERM_COOKIE = "selectedTermId";

export type PeriodType = "SEMESTER" | "EVENT_SERIES";

export type TermOption = {
  id: string;
  name: string;
  periodType: PeriodType;
  startsOn: Date;
  endsOn: Date;
  isActive: boolean;
};

export type TermSelectItem = {
  id: string;
  name: string;
  isActive: boolean;
};

export type DateRange = { gte: Date; lte: Date };

export const TERM_REVALIDATE_PATHS = [
  "/admin/dashboard",
  "/admin/events",
  "/admin/attendance",
  "/admin/sanctions",
  "/admin/fees",
  "/admin/announcements",
  "/admin/transparency",
  "/admin/audit-log",
];

export function termRange(term: TermOption | null): DateRange | null {
  if (!term) return null;
  return { gte: term.startsOn, lte: term.endsOn };
}

type ResolvedTerm = {
  term: TermOption | null;
  terms: TermSelectItem[];
  termId: string | null;
};

/**
 * Resolves the term the admin is currently viewing. Precedence:
 * 1. the term id persisted in the `selectedTermId` cookie (per-session selector)
 * 2. the globally active term
 * 3. the most recent term by start date
 * 4. null when no terms exist
 *
 * Also returns the flat list of terms for the header selector.
 */
export async function getTermContext(): Promise<ResolvedTerm> {
  const cookieStore = await cookies();
  const selectedId = cookieStore.get(SELECTED_TERM_COOKIE)?.value ?? null;

  const rows = await prisma.academicTerm.findMany({
    orderBy: [{ startsOn: "desc" }],
  });

  const terms: TermSelectItem[] = rows.map((t) => ({
    id: t.id,
    name: t.name,
    isActive: t.isActive,
  }));

  const term: TermOption | null = selectedId
    ? (rows.find((t) => t.id === selectedId) ?? null)
    : (rows.find((t) => t.isActive) ?? rows[0] ?? null);

  return { term, terms, termId: term?.id ?? null };
}
