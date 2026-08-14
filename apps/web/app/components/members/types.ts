export interface RemovedAuthInfo {
  officerName: string;
  removedAt: string;
}

export interface MemberItem {
  id: string;
  name: string;
  studentNo: string;
  status: "assigned" | "unassigned";
  sectionId: string | null;
  suspended: boolean;
  removedAuth: RemovedAuthInfo | null;
  programCode: string | null;
  programName: string | null;
  yearLevel: number | null;
  sectionName: string | null;
}

export interface MemberStats {
  total: number;
  assigned: number;
  unassigned: number;
  programs: number;
}

export interface PendingRequest {
  id: string;
  userName: string;
  requestedRole: string;
  requestedRoleId: string;
  scopeType: "SECTION" | "PROGRAM_YEAR";
  programYearId: string | null;
  sectionId: string | null;
  programCode: string | null;
  programName: string | null;
  yearLevel: number | null;
  sectionName: string | null;
  scopeLabel: string;
  requestedAt: string;
}

export interface RejectedRequest {
  id: string;
  userName: string;
  requestedRole: string;
  programCode: string | null;
  programName: string | null;
  yearLevel: number | null;
  sectionName: string | null;
  scopeLabel: string;
  rejectedAt: string;
}

export interface ProgramOption {
  id: string;
  name: string;
  code: string;
}

export interface SectionOption {
  id: string;
  name: string;
  programYearId: string;
  label: string;
}

export interface ProgramYearOption {
  id: string;
  programId: string;
  programCode: string;
  programName: string;
  level: number;
}

export type MemberStatusFilter =
  | "all"
  | "assigned"
  | "unassigned"
  | "suspended"
  | "removedAuth";

export interface MembersViewProps {
  members: MemberItem[];
  stats: MemberStats;
  programs: ProgramOption[];
  sections: SectionOption[];
  pending: PendingRequest[];
  rejected: RejectedRequest[];
  canManage: boolean;
}

export interface MembersSidebarProps {
  members: MemberItem[];
  rejected: RejectedRequest[];
  canManage: boolean;
  onAddMember: () => void;
}

export interface MembersFeedProps {
  members: MemberItem[];
  programs: ProgramOption[];
  query: string;
  page: number;
  statusFilter: MemberStatusFilter;
  programFilter: string;
  onQuery: (q: string) => void;
  onPageChange: (page: number) => void;
  onStatusChange: (s: MemberStatusFilter) => void;
  onProgramChange: (p: string) => void;
  onView: (id: string) => void;
}

export type MemberModal = { kind: "create" } | { kind: "edit"; id: string };
export type MemberDrawer = { kind: "view"; id: string } | null;
export type MemberConfirm =
  | { kind: "edit"; id: string }
  | { kind: "suspend"; id: string }
  | { kind: "removeAuth"; id: string }
  | null;
export type RequestAction =
  | { kind: "approve"; id: string }
  | { kind: "reject"; id: string }
  | null;

export interface MembersModalsProps {
  members: MemberItem[];
  programs: ProgramOption[];
  sections: SectionOption[];
  modal: MemberModal | null;
  drawer: MemberDrawer;
  requestAction: RequestAction;
  pending: PendingRequest[];
  busy: boolean;
  canManage: boolean;
  onCloseModal: () => void;
  onCloseDrawer: () => void;
  onCreate: (fd: FormData) => void;
  onUpdate: (fd: FormData) => void;
  onEdit: (id: string) => void;
  onSuspend: (id: string) => void;
  onRemoveAuth: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}
