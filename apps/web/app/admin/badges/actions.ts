"use server";

import { auth } from "@/auth";
import { getSidebarBadges, markSectionSeen } from "@/lib/sidebar-badges";
import type { BadgeSection, SidebarBadges } from "@/lib/sidebar-badges-nav";

export async function fetchSidebarBadges(): Promise<SidebarBadges | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  try {
    return await getSidebarBadges(session.user.id);
  } catch {
    return null;
  }
}

export async function setSectionSeen(section: BadgeSection): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  try {
    await markSectionSeen(session.user.id, section);
  } catch {
    // ignore — badge state is best-effort
  }
}
