-- AlterTable
ALTER TABLE "Student" ADD COLUMN "suspended" BOOLEAN NOT NULL DEFAULT false;

-- AlterEnum AuditAction: add member management actions
ALTER TYPE "AuditAction" ADD VALUE 'MEMBER_SUSPENDED';
ALTER TYPE "AuditAction" ADD VALUE 'MEMBER_REINSTATED';
ALTER TYPE "AuditAction" ADD VALUE 'MEMBER_AUTHORIZATION_REMOVED';
