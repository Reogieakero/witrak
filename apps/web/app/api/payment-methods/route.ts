import { NextResponse } from "next/server";
import { prisma } from "@fhusocom/db";

export async function GET() {
  try {
    const methods = await prisma.paymentMethod.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        type: true,
        accountName: true,
        accountNumber: true,
        instructions: true,
      },
    });
    return NextResponse.json({ methods });
  } catch {
    return NextResponse.json({ methods: [] });
  }
}
