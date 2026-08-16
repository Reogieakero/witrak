import { NextResponse } from "next/server";
import { prisma } from "@fhusocom/db";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const email = data.user?.email?.toLowerCase().trim();
      if (email) {
        const dbUser = await prisma.user.findFirst({
          where: { email, deletedAt: null },
          select: { id: true, student: { select: { id: true } } },
        });

        // Registered student → send to their destination.
        if (dbUser?.student?.id) {
          return NextResponse.redirect(`${origin}${next}`);
        }

        // Google account not registered to the system → complete the profile.
        return NextResponse.redirect(
          `${origin}/auth/complete-profile?next=${encodeURIComponent(next)}`,
        );
      }

      return NextResponse.redirect(`${origin}/login/students?error=oauth_failed`);
    }
  }

  return NextResponse.redirect(`${origin}/login/students?error=oauth_failed`);
}
