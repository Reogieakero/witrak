export type AuditModuleKey = "all" | "roles" | "sanctions" | "fees" | "members";

export interface AuditEntry {
  id: number;
  action: string;
  module: Exclude<AuditModuleKey, "all">;
  actorName: string;
  actorInitial: string;
  targetName: string;
  targetDetail: string;
  summary: string;
  details: Record<string, unknown>;
  timestamp: string;
  relative: string;
}

export interface AuditStats {
  total: number;
  thisWeek: number;
  actors: number;
  systemIssued: number;
  byModule: { module: AuditModuleKey; label: string; count: number }[];
  termName: string;
}

export interface AuditLogViewProps {
  entries: AuditEntry[];
  stats: AuditStats;
}

export interface AuditLogStatsGridProps {
  stats: AuditStats;
}

export interface AuditLogFeedProps {
  entries: AuditEntry[];
  query: string;
  module: AuditModuleKey;
  page: number;
  onQuery: (q: string) => void;
  onModule: (m: AuditModuleKey) => void;
  onPageChange: (page: number) => void;
  onView: (id: number) => void;
}

export interface AuditLogSidebarProps {
  entries: AuditEntry[];
  stats: AuditStats;
}

export interface AuditLogModalsProps {
  entries: AuditEntry[];
  detailId: number | null;
  onCloseDetail: () => void;
}
