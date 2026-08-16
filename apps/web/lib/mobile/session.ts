import "server-only";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@fhusocom/db";
import { resolveUserAccess } from "@/lib/access";
import { hasPermission, type UserAccess } from "@/lib/permissions";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type MobileSession = {
  userId: string;
  name: string;
  email?: string;
  roleLabel: string;
  access: UserAccess;
};

/**
 * Resolves a mobile session from a Supabase access token sent as
 * `Authorization: Bearer <token>`. The token is validated against the same
 * Supabase Auth provider the web portal uses, then mapped to the application
 * `User` row (linked by `supabaseId`, falling back to email) and its RBAC access.
 */
export async function mobileSessionFromRequest(
  request: Request,
): Promise<MobileSession | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  let dbUser = await prisma.user.findFirst({
    where: { supabaseId: user.id, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      roles: { include: { role: { select: { name: true } } } },
    },
  });

  if (!dbUser && user.email) {
    dbUser = await prisma.user.findFirst({
      where: { email: user.email, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        roles: { include: { role: { select: { name: true } } } },
      },
    });
  }

  if (!dbUser) return null;

  const access = await resolveUserAccess(dbUser.id);
  const roleLabel = dbUser.roles.some((r) => r.role.name === "Super Admin")
    ? "Super Admin"
    : (dbUser.roles[0]?.role.name ?? "Officer");

  return {
    userId: dbUser.id,
    name: dbUser.name,
    email: dbUser.email ?? undefined,
    roleLabel,
    access,
  };
}

export function mobileCanScan(
  session: MobileSession | null,
): session is MobileSession {
  return session !== null && hasPermission(session.access, "attendance_scan");
}

export function unauthorized(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden(message = "You don't have permission for this."): Response {
  return Response.json({ error: message }, { status: 403 });
}
