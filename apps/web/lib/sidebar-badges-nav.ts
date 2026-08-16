export const BADGE_SECTIONS = [
  "events",
  "sanctions",
  "fees",
  "announcements",
  "transparency",
  "members",
] as const;

export type BadgeSection = (typeof BADGE_SECTIONS)[number];

export type SidebarBadges = Record<BadgeSection, number>;

export const PATH_TO_SECTION: Partial<Record<string, BadgeSection>> = {
  "/admin/events": "events",
  "/admin/sanctions": "sanctions",
  "/admin/fees": "fees",
  "/admin/announcements": "announcements",
  "/admin/transparency": "transparency",
  "/admin/members": "members",
};
