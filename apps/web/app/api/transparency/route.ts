import { NextResponse } from "next/server";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/permissions";
import { handleError } from "@/lib/api";
import { cached, CACHE_TTL } from "@/lib/cache";

export async function GET() {
  try {
    const session = await auth();
    requirePermission(session?.access, "transparency_view");

    const files = await cached(
      `api:transparency:${session?.user?.id ?? "anon"}`,
      CACHE_TTL.SHORT,
      () =>
        prisma.transparencyFile.findMany({
          orderBy: { uploadedAt: "desc" },
          include: { uploadedBy: { select: { name: true } } },
          take: 200,
        }),
    );

    return NextResponse.json({ files });
  } catch (e) {
    return handleError(e);
  }
}
