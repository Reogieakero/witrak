"use client";

import type { ComponentType } from "react";

type ViewLoader = () => Promise<ComponentType<Record<string, unknown>>>;

export const VIEW_REGISTRY: Record<string, ViewLoader> = {
  "/admin/members": async () =>
    ((await import("@/app/components/members/members-view")) as unknown as {
      MembersView: ComponentType<Record<string, unknown>>;
    }).MembersView,
  "/admin/sanctions": async () =>
    ((await import("@/app/components/sanctions/sanctions-view")) as unknown as {
      SanctionsView: ComponentType<Record<string, unknown>>;
    }).SanctionsView,
  "/admin/audit-log": async () =>
    ((await import("@/app/components/audit-log/audit-log-view")) as unknown as {
      AuditLogView: ComponentType<Record<string, unknown>>;
    }).AuditLogView,
  "/admin/fees": async () =>
    ((await import("@/app/components/fees/fees-view")) as unknown as {
      FeesView: ComponentType<Record<string, unknown>>;
    }).FeesView,
  "/admin/attendance": async () =>
    ((await import("@/app/components/attendance/attendance-view")) as unknown as {
      AttendanceView: ComponentType<Record<string, unknown>>;
    }).AttendanceView,
  "/admin/students": async () =>
    ((await import("@/app/components/students/students-view")) as unknown as {
      StudentsView: ComponentType<Record<string, unknown>>;
    }).StudentsView,
  "/admin/transparency": async () =>
    ((await import("@/app/components/transparency/transparency-view")) as unknown as {
      TransparencyView: ComponentType<Record<string, unknown>>;
    }).TransparencyView,
  "/admin/announcements": async () =>
    ((await import("@/app/components/announcements/announcements-view")) as unknown as {
      AnnouncementsView: ComponentType<Record<string, unknown>>;
    }).AnnouncementsView,
  "/admin/events": async () =>
    ((await import("@/app/components/events/events-view")) as unknown as {
      EventsView: ComponentType<Record<string, unknown>>;
    }).EventsView,
};
