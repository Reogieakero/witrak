-- AlterEnum
-- Adds multiple values in one migration; PostgreSQL 12+ only.
-- These enum variants were previously applied via `prisma db push` but were
-- never recorded in migration history. They are baselined here.
ALTER TYPE "PermissionKey" ADD VALUE 'announcements_edit';
ALTER TYPE "PermissionKey" ADD VALUE 'members_view';

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_studentId_fkey";

-- DropIndex
DROP INDEX "User_studentId_key";

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "imagePath" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "programId" TEXT,
ADD COLUMN     "scopeType" "ScopeType" NOT NULL DEFAULT 'FACULTY';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "userId" TEXT;

-- Backfill existing students that already have a linked account
UPDATE "Student" s
SET "userId" = u."id"
FROM "User" u
WHERE u."studentId" = s."id";

-- Auto-create default accounts for orphan students (no linked account yet).
-- These accounts can be claimed later via the officer portal. At this point the
-- legacy `passwordHash` column still exists (NOT NULL) and is backfilled with a
-- placeholder; it is dropped by a later migration when auth moves to Supabase.
INSERT INTO "User" ("id", "email", "name", "passwordHash")
SELECT
  'orphan-' || s."id",
  lower(s."studentNo") || '@fhusocom.edu',
  s."firstName" || ' ' || s."lastName",
  '$2b$10$4kGTdSLEF80hzP1q0mSrP.mJ7vFVRc0Vj.P1bRjZcbAKJnO97Enrm'
FROM "Student" s
WHERE s."userId" IS NULL;

UPDATE "Student" s
SET "userId" = 'orphan-' || s."id"
WHERE s."userId" IS NULL;

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "studentId";

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;