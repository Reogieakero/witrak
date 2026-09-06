import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck2,
  CalendarPlus,
  CheckCheck,
  ClipboardList,
  Download,
  FolderOpen,
  GraduationCap,
  HandCoins,
  LayoutDashboard,
  Megaphone,
  QrCode,
  ScrollText,
  ShieldAlert,
  Upload,
  UserCog,
  Users,
} from "lucide-react";

export const money = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export const ACTION_LABELS: Record<string, string> = {
  ROLE_ASSIGNED: "Role assigned",
  ROLE_REVOKED: "Role revoked",
  SCOPE_CHANGED: "Scope changed",
  ROLE_REQUEST_REJECTED: "Request rejected",
  SANCTION_CREATED: "Sanction created",
  SANCTION_RESOLVED: "Sanction resolved",
  FLAG_DISMISSED: "Flag dismissed",
  FLAG_AUTO_DISMISSED: "Flag auto-dismissed",
  PAYMENT_VERIFIED: "Fee verified",
  PAYMENT_REJECTED: "Payment rejected",
  REPORT_SUBMITTED: "Report submitted",
  REPORT_RESOLVED: "Report resolved",
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
  visibleRoles?: string[];
};

export const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/admin/events", icon: CalendarCheck2, visibleRoles: ["Supreme", "Year/Program Rep", "Vice President", "PIO", "Auditor", "Adviser"] },
  { label: "Attendance", href: "/admin/attendance", icon: QrCode, visibleRoles: ["Supreme", "Secretary", "Discipline Officer", "Year/Program Rep", "Vice President", "Adviser"] },
  { label: "Reports", href: "/admin/reports", icon: ClipboardList, visibleRoles: ["Supreme", "Secretary", "Discipline Officer", "Year/Program Rep", "Vice President", "Adviser"] },
  { label: "Transparency", href: "/admin/transparency", icon: FolderOpen, visibleRoles: ["Supreme", "Treasurer", "Year/Program Rep", "Vice President", "PIO", "Auditor", "Adviser"] },
  { label: "Sanctions", href: "/admin/sanctions", icon: ShieldAlert, visibleRoles: ["Supreme", "Discipline Officer"] },
  { label: "Fees", href: "/admin/fees", icon: HandCoins, visibleRoles: ["Supreme", "Treasurer", "Auditor"] },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone, visibleRoles: ["Supreme", "Secretary", "Treasurer", "Vice President", "PIO", "Auditor", "Adviser"] },
  { label: "Members", href: "/admin/members", icon: Users, visibleRoles: ["Supreme", "Treasurer", "Discipline Officer", "Year/Program Rep", "Vice President", "PIO", "Auditor", "Adviser"] },
];

export const SYSTEM_NAV: NavItem[] = [
  { label: "Students", href: "/admin/students", icon: GraduationCap, visibleRoles: ["Supreme"] },
  { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText, visibleRoles: ["Supreme", "PIO", "Auditor", "Adviser"] },
];

export type QuickAction = {
  label: string;
  sub: string;
  icon: LucideIcon;
  href: string;
  visibleRoles?: string[];
};

export const QUICK_ACTIONS: QuickAction[] = [
  { label: "Assign Role", sub: "Officers", icon: UserCog, href: "/admin/members", visibleRoles: ["Supreme"] },
  { label: "Approve Req.", sub: "Role requests", icon: CheckCheck, href: "/admin/members", visibleRoles: ["Supreme"] },
  { label: "New Event", sub: "Schedule", icon: CalendarPlus, href: "/admin/events", visibleRoles: ["Supreme", "Year/Program Rep", "Vice President"] },
  { label: "Scan Attendance", sub: "Log entry", icon: QrCode, href: "/admin/attendance", visibleRoles: ["Supreme", "Secretary", "Discipline Officer", "Year/Program Rep", "Vice President", "Adviser"] },
  { label: "Upload Doc", sub: "Transparency", icon: Upload, href: "/admin/transparency", visibleRoles: ["Supreme", "Treasurer", "Year/Program Rep", "Vice President", "PIO", "Auditor", "Adviser"] },
  { label: "Export Reports", sub: "PDF / CSV", icon: Download, href: "/admin/transparency", visibleRoles: ["Supreme", "Treasurer", "Year/Program Rep", "Vice President", "PIO", "Auditor", "Adviser"] },
];
