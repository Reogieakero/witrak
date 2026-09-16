/**
 * One-off cleanup: delete stored images for existing PAID / REJECTED fee proofs.
 *
 * - Keeps the FeeProof record (status, verifier, audit log untouched).
 * - Deletes the object in the `fee-proofs` Supabase bucket (best-effort).
 * - Clears `fileUrl` to "" so UI shows "No file uploaded" instead of a dead link.
 * - NEVER touches PENDING proofs. NEVER deletes records. NO migration.
 *
 * Usage (run from packages/db):
 *   npx tsx cleanup-fee-proof-files.mts            -> dry-run (read-only, default)
 *   npx tsx cleanup-fee-proof-files.mts --apply    -> performs storage + DB updates
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const FEE_PROOFS_BUCKET = "fee-proofs";
const APPLY = process.argv.includes("--apply");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const prisma = new PrismaClient();

function feeProofPathFromUrl(fileUrl: string): string | null {
  const url = String(fileUrl ?? "").trim();
  if (!url) return null;
  const marker = `/${FEE_PROOFS_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx >= 0) {
    const path = url.slice(idx + marker.length).split("?")[0];
    return path ? decodeURIComponent(path) : null;
  }
  return null; // legacy / non-Supabase URL: nothing to delete in this bucket
}

async function main() {
  console.log(
    APPLY
      ? "=== fee-proof cleanup: APPLY mode ==="
      : "=== fee-proof cleanup: DRY-RUN (no changes) ===",
  );

  const rows = await prisma.feeProof.findMany({
    where: {
      status: { in: ["PAID", "REJECTED"] },
      NOT: { fileUrl: "" },
    },
    select: { id: true, status: true, fileUrl: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const paid = rows.filter((r) => r.status === "PAID").length;
  const rejected = rows.filter((r) => r.status === "REJECTED").length;
  const withStoragePath = rows.filter((r) => feeProofPathFromUrl(r.fileUrl)).length;
  const legacy = rows.length - withStoragePath;

  console.log(`Found ${rows.length} PAID/REJECTED proofs with fileUrl set.`);
  console.log(`  PAID: ${paid}, REJECTED: ${rejected}`);
  console.log(`  With deletable storage path: ${withStoragePath}`);
  console.log(`  Legacy/non-Supabase URLs (DB clear only): ${legacy}`);

  for (const r of rows.slice(0, 10)) {
    console.log(
      `  sample ${r.status} ${r.id} -> path=${feeProofPathFromUrl(r.fileUrl) ?? "(none)"}`,
    );
  }
  if (rows.length > 10) console.log(`  ... and ${rows.length - 10} more`);

  if (!APPLY) {
    console.log("\nDry-run complete. No storage or DB changes made.");
    console.log("Re-run with --apply to delete files and clear fileUrl.");
    return;
  }

  let deletedFiles = 0;
  let storageWarnings = 0;
  let clearedRows = 0;

  for (const row of rows) {
    const path = feeProofPathFromUrl(row.fileUrl);
    if (path) {
      try {
        const { error } = await supabase.storage
          .from(FEE_PROOFS_BUCKET)
          .remove([path]);
        if (error) throw new Error(error.message);
        deletedFiles++;
      } catch (e) {
        storageWarnings++;
        console.warn(
          `  storage delete skipped/failed for ${row.id} (${path}): ${e instanceof Error ? e.message : e}`,
        );
      }
    }
    // Always clear DB link so no dead URL remains — record itself is kept.
    await prisma.feeProof.update({
      where: { id: row.id },
      data: { fileUrl: "" },
    });
    clearedRows++;
    if (clearedRows % 50 === 0) console.log(`  progress: ${clearedRows}/${rows.length}`);
  }

  console.log("\n=== done ===");
  console.log(`  storage files deleted: ${deletedFiles}`);
  console.log(`  storage warnings: ${storageWarnings}`);
  console.log(`  DB rows cleared (fileUrl=""): ${clearedRows}`);
  console.log("  records kept: all (no deletes)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
