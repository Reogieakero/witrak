export interface StudentAccount {
  id: string;
  userId: string;
  name: string;
  studentNo: string;
  email: string;
  suspended: boolean;
  sectionId: string | null;
  programCode: string | null;
  programName: string | null;
  yearLevel: number | null;
  sectionName: string | null;
  roles: string[];
}

export interface StudentStats {
  total: number;
  active: number;
  suspended: number;
  programs: number;
}

export interface ProgramOption {
  id: string;
  name: string;
  code: string;
}

export type StudentStatusFilter =
  | "all"
  | "active"
  | "suspended";

export interface StudentsViewProps {
  students: StudentAccount[];
  stats: StudentStats;
  programs: ProgramOption[];
  canManage: boolean;
}

export interface StudentsFeedProps {
  students: StudentAccount[];
  programs: ProgramOption[];
  query: string;
  page: number;
  statusFilter: StudentStatusFilter;
  programFilter: string;
  onQuery: (q: string) => void;
  onPageChange: (page: number) => void;
  onStatusChange: (s: StudentStatusFilter) => void;
  onProgramChange: (p: string) => void;
  onView: (id: string) => void;
}

export interface StudentsSidebarProps {
  students: StudentAccount[];
}

export type StudentDrawer = { kind: "view"; id: string } | null;
export type StudentConfirm = { kind: "suspend"; id: string } | null;

export interface StudentsModalsProps {
  students: StudentAccount[];
  drawer: StudentDrawer;
  canManage: boolean;
  onCloseDrawer: () => void;
  onSuspend: (id: string) => void;
}