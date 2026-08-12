import { NextResponse } from "next/server";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/permissions";
import { handleError } from "@/lib/api";
import { writeFile, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

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
    const title = formData.get("title") as string;
    const category = (formData.get("category") as string) ?? "reports";
    const file = formData.get("file") as File | null;

    if (!title || !file || file.size === 0) {
      return NextResponse.json(
        { ok: false, error: "Title and file are required." },
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "File must be under 10 MB." },
        { status: 400 },
      );
    }

    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const ext = file.name.split(".").pop();
    const storedName = `${randomUUID()}.${ext}`;
    const filePath = join(UPLOAD_DIR, storedName);
    const buffer = await file.arrayBuffer();
    await new Promise<void>((resolve, reject) => {
      writeFile(filePath, Buffer.from(buffer), (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const fileUrl = `/uploads/${storedName}`;
    const size = formatFileSize(file.size);

    await prisma.transparencyFile.create({
      data: {
        title: title.trim(),
        fileUrl,
        category,
        uploadedById: userId,
      },
    });

    return NextResponse.json({
      ok: true,
      file: {
        title: title.trim(),
        fileUrl,
        category,
        size,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
