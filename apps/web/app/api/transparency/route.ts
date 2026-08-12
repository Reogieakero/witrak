import { NextResponse } from "next/server";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/permissions";
import { handleError } from "@/lib/api";

export async function GET() {
  try {
    const session = await auth();
    requirePermission(session?.access, "transparency_view");

    const files = await prisma.transparencyFile.findMany({
      orderBy: { uploadedAt: "desc" },
      include: { uploadedBy: { select: { name: true } } },
    });

    return NextResponse.json({ files });
  } catch (e) {
    return handleError(e);
  }
}
