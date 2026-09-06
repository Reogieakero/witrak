-- Add new AuditAction values for report lifecycle
ALTER TYPE "AuditAction" ADD VALUE 'REPORT_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE 'REPORT_RESOLVED';

-- Add new PermissionKey values for report management
ALTER TYPE "PermissionKey" ADD VALUE 'reports_view';
ALTER TYPE "PermissionKey" ADD VALUE 'reports_manage';

-- Add resolutionNote column to Report for admin resolution details
ALTER TABLE "Report" ADD COLUMN "resolutionNote" TEXT;
