"use client";

export type SanctionsListTab = "all" | "active" | "resolved";

export type SanctionScopeType = "FACULTY" | "PROGRAM" | "PROGRAM_YEAR" | "SECTION";
export type SanctionPeriodType = "SEMESTER" | "EVENT_SERIES";

export interface SanctionRuleOption {
  id: string;
  label: string;
  threshold: number;
  scopeType: SanctionScopeType;
  scopeLabel: string;
  programId?: string;
  programYearId?: string;
  sectionId?: string;
  period: SanctionPeriodType;
  active: boolean;
}

export interface SanctionScopeOptions {
  programs: { id: string; code: string; name: string }[];
  programYears: { id: string; programId: string; level: number }[];
  sections: { id: string; name: string; programYearId: string }[];
}

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
  ruleThreshold: number;
  triggerCount: number;
  outcome: "Open" | "Cleared";
  createdAt: string;
  resolvedBy?: string;
  evidence: EvidenceRow[];
}

export interface SanctionsViewProps {
  sanctions: SanctionItem[];
  stats: SanctionStats;
  rules: SanctionRuleOption[];
  activityLogs: SanctionsActivityItem[];
  canCreate: boolean;
  canResolve: boolean;
  scopeOptions: SanctionScopeOptions;
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
  kind: "rule" | "editRule" | "edit";
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
  rules: SanctionRuleOption[];
  activityLogs: SanctionsActivityItem[];
  modal: SanctionsModal | null;
  drawer: SanctionsDrawer | null;
  onCloseModal: () => void;
  onCloseDrawer: () => void;
  onCreateRule: FormHandler;
  onEditRule: FormHandler;
  onEdit: FormHandler;
  canCreate: boolean;
  scopeOptions: SanctionScopeOptions;
  onEditFor: (sanctionId: string) => void;
  onResolve: (sanctionId: string) => void;
}