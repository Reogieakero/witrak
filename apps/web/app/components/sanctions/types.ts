"use client";

export type SanctionsListTab = "all" | "active" | "resolved";

export interface EvidenceRow {
  eventTitle: string;
  date: string;
  status: string;
}

export interface SanctionStats {
  activeSanctions: number;
  resolved: number;
  total: number;
  termName: string;
}

export interface SanctionItem {
  id: string;
  kind: "sanction" | "resolved";
  studentName: string;
  studentNo: string;
  sectionName: string;
  yearLevel: number;
  programCode: string;
  title: string;
  reason: string;
  absences: number;
  fineTitle: string | null;
  requirement: string | null;
  outcome: "Open" | "Cleared";
  createdAt: string;
  resolvedBy?: string;
  evidence: EvidenceRow[];
}

export interface SanctionFineRow {
  absenceCount: number;
  title: string;
  description: string;
}

export interface SanctionsViewProps {
  sanctions: SanctionItem[];
  stats: SanctionStats;
  activityLogs: SanctionsActivityItem[];
  fines: SanctionFineRow[];
  canCreate: boolean;
  canResolve: boolean;
}

export interface SanctionsStatsGridProps {
  stats: SanctionStats;
}

export interface SanctionsTablesProps {
  sanctions: SanctionItem[];
  tab: SanctionsListTab;
  onTab: (tab: SanctionsListTab) => void;
  query: string;
  onQuery: (q: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  canResolve: boolean;
  canEdit: boolean;
  onView: (sanctionId: string) => void;
  onResolve: (sanctionId: string) => void;
  onEdit: (sanctionId: string) => void;
  disabled?: boolean;
}

export type FormHandler = (formData: FormData) => void;

export type SanctionsModal = {
  kind: "edit" | "fines";
  id?: string;
};
export type SanctionsDrawer = { kind: "sanction" | "activity"; id?: string };

export interface SanctionsActivityItem {
  id: number;
  action: string;
  details: string;
  targetId: string | null;
  actorName: string;
  when: string;
}

export interface SanctionsModalsProps {
  sanctions: SanctionItem[];
  activityLogs: SanctionsActivityItem[];
  fines: SanctionFineRow[];
  modal: SanctionsModal | null;
  drawer: SanctionsDrawer | null;
  onCloseModal: () => void;
  onCloseDrawer: () => void;
  onEdit: FormHandler;
  onSaveFines: (rows: SanctionFineRow[]) => void;
  canCreate: boolean;
  onEditFor: (sanctionId: string) => void;
  onResolve: (sanctionId: string) => void;
}