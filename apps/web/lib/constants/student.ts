import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck2,
  FolderOpen,
  HandCoins,
  LayoutDashboard,
  Megaphone,
  QrCode,
  ShieldAlert,
} from "lucide-react";

export type StudentNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  anchor?: boolean;
};

export const STUDENT_NAV: StudentNavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Announcements", href: "/dashboard#announcements", icon: Megaphone, anchor: true },
  { label: "Events", href: "/dashboard#events", icon: CalendarCheck2, anchor: true },
  { label: "Fees", href: "/dashboard/fees", icon: HandCoins },
  { label: "Attendance", href: "/dashboard#attendance", icon: QrCode, anchor: true },
  { label: "Transparency", href: "/dashboard#transparency", icon: FolderOpen, anchor: true },
  { label: "Sanctions", href: "/dashboard#sanctions", icon: ShieldAlert, anchor: true },
];