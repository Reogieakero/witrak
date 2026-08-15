import "server-only";
import { prisma } from "@fhusocom/db";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { resolveUserAccess } from "@/lib/access";
import type { UserAccess } from "@/lib/permissions";

export type AppSession = {
  user: { id: string; email?: string; name?: string };
  access: UserAccess | null;
};

/**
 * Resolves the current request's session.
 *
 * Replaces the previous NextAuth/Auth.js `auth()` call. The return shape is
 * intentionally identical to the legacy contract so that every page, route
 * handler, and server action that reads `session.user.id` / `session.access`
 * keeps working unchanged.
 *
 * Identity is established from the Supabase Auth session cookie, then mapped to
 * our `User` row (linked by `supabaseId`, falling back to email). RBAC access
 * (`permissions` + resolved `scopeSectionIds`) is resolved from the database.
 */
export async function auth(): Promise<AppSession | null> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let dbUser = await prisma.user.findFirst({
    where: { supabaseId: user.id, deletedAt: null },
    select: { id: true, email: true, name: true },
  });

  if (!dbUser && user.email) {
    dbUser = await prisma.user.findFirst({
      where: { email: user.email, deletedAt: null },
      select: { id: true, email: true, name: true },
    });
  }

  if (!dbUser) return null;

  const access = await resolveUserAccess(dbUser.id);

  return {
    user: { id: dbUser.id, email: dbUser.email, name: dbUser.name },
    access,
  };
}
