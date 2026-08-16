-- Sanction rules are removed; sanctions are now issued by absence count
-- against the SanctionFine catalog.

-- AlterTable Sanction: drop ruleId
ALTER TABLE "Sanction" DROP CONSTRAINT "Sanction_ruleId_fkey";
ALTER TABLE "Sanction" DROP COLUMN "ruleId";
DROP INDEX "Sanction_ruleId_idx";

-- AlterTable SanctionFlag: drop ruleId
ALTER TABLE "SanctionFlag" DROP CONSTRAINT "SanctionFlag_ruleId_fkey";
ALTER TABLE "SanctionFlag" DROP COLUMN "ruleId";
DROP INDEX "SanctionFlag_studentId_ruleId_periodRef_idx";
CREATE INDEX "SanctionFlag_studentId_periodRef_idx" ON "SanctionFlag"("studentId", "periodRef");

-- DropTable SanctionRule
ALTER TABLE "SanctionRule" DROP CONSTRAINT "SanctionRule_programId_fkey";
ALTER TABLE "SanctionRule" DROP CONSTRAINT "SanctionRule_programYearId_fkey";
ALTER TABLE "SanctionRule" DROP CONSTRAINT "SanctionRule_sectionId_fkey";
DROP TABLE "SanctionRule";
