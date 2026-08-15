import { NextResponse } from "next/server";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/permissions";
import { randomUUID } from "crypto";
import { uploadTransparencyFile } from "@/lib/supabase-storage";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    requirePermission(session?.access, "transparency_upload");

    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const category = String(formData.get("category") ?? "reports").trim();
    const file = formData.get("file") as File | null;

    const VALID_CATEGORIES = ["financial", "events", "minutes", "reports"];

    if (!title || !file || file.size === 0) {
      return NextResponse.json(
        { ok: false, error: "Title and file are required." },
        { status: 400 },
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { ok: false, error: "Title must be under 200 characters." },
        { status: 400 },
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { ok: false, error: "Choose a valid file category." },
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "File must be under 10 MB." },
        { status: 400 },
      );
    }

    const ext = file.name.split(".").pop();
    const storedName = `${randomUUID()}.${ext}`;
    const buffer = await file.arrayBuffer();

    const { publicUrl } = await uploadTransparencyFile(
      storedName,
      buffer,
      file.type || "application/octet-stream",
    );

    const size = formatFileSize(file.size);

    await prisma.transparencyFile.create({
      data: {
        title: title.trim(),
        fileUrl: publicUrl,
        category,
        uploadedById: userId,
      },
    });

    return NextResponse.json({
      ok: true,
      file: {
        title: title.trim(),
        fileUrl: publicUrl,
        category,
        size,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed.";
    console.error("Transparency upload error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
