import { prisma } from "@fhusocom/db";
import { getTermContext } from "./terms";
import type { BadgeSection, SidebarBadges } from "./sidebar-badges-nav";

/**
 * Returns the last-seen timestamp for a section, establishing a baseline on
 * first load so badges never light up for pre-existing items — only for new
 * activity after the admin has started using the app.
 */
async function getOrCreateSeenAt(
  userId: string,
  section: BadgeSection,
): Promise<Date> {
  const existing = await prisma.seenState.findUnique({
    where: { userId_section: { userId, section } },
    select: { seenAt: true },
  });
  if (existing) return existing.seenAt;

  const now = new Date();
  try {
    await prisma.seenState.create({ data: { userId, section, seenAt: now } });
  } catch {
    // concurrent first-write on the unique key — the other writer wins
  }
  return now;
}

/**
 * Persists the moment the admin last visited a section. Badges for that
 * section disappear once they have been seen (Facebook-style read state).
 */
export async function markSectionSeen(
  userId: string,
  section: BadgeSection,
): Promise<void> {
  await prisma.seenState.upsert({
    where: { userId_section: { userId, section } },
    create: { userId, section, seenAt: new Date() },
    update: { seenAt: new Date() },
  });
}

/**
 * Counts unread items per sidebar section for an admin. Feed-style items
 * (events, announcements, transparency) count what was created after the last
 * visit; action items (sanctions, fees) count open/pending records issued
 * after the last visit; members counts pending role requests until acted on.
 */
export async function getSidebarBadges(userId: string): Promise<SidebarBadges> {
  const { term } = await getTermContext();
  const range = term ? { gte: term.startsOn, lte: term.endsOn } : null;

  const [seenEvents, seenSanctions, seenFees, seenAnnouncements, seenTransparency] =
    await Promise.all([
      getOrCreateSeenAt(userId, "events"),
      getOrCreateSeenAt(userId, "sanctions"),
      getOrCreateSeenAt(userId, "fees"),
      getOrCreateSeenAt(userId, "announcements"),
      getOrCreateSeenAt(userId, "transparency"),
    ]);

  const issuedAtFilter = {
    ...(range ? { gte: range.gte, lte: range.lte } : {}),
    ...(seenSanctions ? { gt: seenSanctions } : {}),
  };

  const [events, sanctions, fees, announcements, transparency, members] =
    await Promise.all([
      prisma.event.count({
        where: {
          ...(range ? { startsAt: range } : {}),
          ...(seenEvents ? { createdAt: { gt: seenEvents } } : {}),
        },
      }),
      prisma.sanction.count({
        where: {
          status: "OPEN",
          ...(Object.keys(issuedAtFilter).length ? { issuedAt: issuedAtFilter } : {}),
        },
      }),
      prisma.feeProof.count({
        where: {
          status: "PENDING",
          ...(seenFees ? { createdAt: { gt: seenFees } } : {}),
        },
      }),
      prisma.announcement.count({
        where: seenAnnouncements ? { createdAt: { gt: seenAnnouncements } } : {},
      }),
      prisma.transparencyFile.count({
        where: seenTransparency ? { uploadedAt: { gt: seenTransparency } } : {},
      }),
      prisma.roleRequest.count({ where: { status: "PENDING" } }),
    ]);

  return { events, sanctions, fees, announcements, transparency, members };
}
