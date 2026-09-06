-- Add new AuditAction values for report lifecycle
-- IF NOT EXISTS handles cases where values were applied via db push
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'REPORT_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'REPORT_RESOLVED';

-- Add new PermissionKey values for report management
ALTER TYPE "PermissionKey" ADD VALUE IF NOT EXISTS 'reports_view';
ALTER TYPE "PermissionKey" ADD VALUE IF NOT EXISTS 'reports_manage';

-- Add resolutionNote column to Report for admin resolution details
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "resolutionNote" TEXT;
