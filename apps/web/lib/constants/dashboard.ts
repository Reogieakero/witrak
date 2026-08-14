import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck2,
  CalendarPlus,
  CheckCheck,
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
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

export const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/admin/events", icon: CalendarCheck2 },
  { label: "Attendance", href: "/admin/attendance", icon: QrCode },
  { label: "Transparency", href: "/admin/transparency", icon: FolderOpen },
  { label: "Sanctions", href: "/admin/sanctions", icon: ShieldAlert },
  { label: "Fees", href: "/admin/fees", icon: HandCoins },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { label: "Members", href: "/admin/members", icon: Users },
];

export const SYSTEM_NAV: NavItem[] = [
  { label: "Students", href: "/admin/students", icon: GraduationCap },
  { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText },
];

export type QuickAction = {
  label: string;
  sub: string;
  icon: LucideIcon;
  href: string;
};

export const QUICK_ACTIONS: QuickAction[] = [
  { label: "Assign Role", sub: "Officers", icon: UserCog, href: "/admin/members" },
  { label: "Approve Req.", sub: "Role requests", icon: CheckCheck, href: "/admin/members" },
  { label: "New Event", sub: "Schedule", icon: CalendarPlus, href: "/admin/events" },
  { label: "Scan Attendance", sub: "Log entry", icon: QrCode, href: "/admin/attendance" },
  { label: "Upload Doc", sub: "Transparency", icon: Upload, href: "/admin/transparency" },
  { label: "Export Reports", sub: "PDF / CSV", icon: Download, href: "/admin/transparency" },
];
