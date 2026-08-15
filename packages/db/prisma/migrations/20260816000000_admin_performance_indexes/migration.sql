-- Add indexes for the hot list/aggregation queries used by the admin panel.

-- Student: scope filters by sectionId + directory ordering by name
CREATE INDEX "Student_sectionId_idx" ON "Student"("sectionId");
CREATE INDEX "Student_lastName_firstName_idx" ON "Student"("lastName", "firstName");

-- RoleRequest: filtering pending/rejected requests per user
CREATE INDEX "RoleRequest_userId_idx" ON "RoleRequest"("userId");

-- Event: term range queries by startsAt + owner checks
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");
CREATE INDEX "Event_createdById_idx" ON "Event"("createdById");

-- Attendance: term-scoped reads by scannedAt
CREATE INDEX "Attendance_scannedAt_idx" ON "Attendance"("scannedAt");

-- SanctionRule: active rule lookups during recompute/backfill
CREATE INDEX "SanctionRule_active_idx" ON "SanctionRule"("active");
CREATE INDEX "SanctionRule_scopeType_idx" ON "SanctionRule"("scopeType");

-- Sanction: list by student/status/date
CREATE INDEX "Sanction_studentId_idx" ON "Sanction"("studentId");
CREATE INDEX "Sanction_ruleId_idx" ON "Sanction"("ruleId");
CREATE INDEX "Sanction_status_idx" ON "Sanction"("status");
CREATE INDEX "Sanction_issuedAt_idx" ON "Sanction"("issuedAt");

-- SanctionEvidence: cascade lookups by attendance during event delete
CREATE INDEX "SanctionEvidence_attendanceId_idx" ON "SanctionEvidence"("attendanceId");

-- Fee: listing and date-range reads
CREATE INDEX "Fee_dueDate_idx" ON "Fee"("dueDate");
CREATE INDEX "Fee_createdAt_idx" ON "Fee"("createdAt");
CREATE INDEX "Fee_createdById_idx" ON "Fee"("createdById");

-- FeeProof: joins by fee + term range reads
CREATE INDEX "FeeProof_feeId_idx" ON "FeeProof"("feeId");
CREATE INDEX "FeeProof_createdAt_idx" ON "FeeProof"("createdAt");

-- TransparencyFile: listing + uploader joins
CREATE INDEX "TransparencyFile_uploadedAt_idx" ON "TransparencyFile"("uploadedAt");
CREATE INDEX "TransparencyFile_uploadedById_idx" ON "TransparencyFile"("uploadedById");

-- Announcement: term range reads + author joins
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");
CREATE INDEX "Announcement_createdById_idx" ON "Announcement"("createdById");
CREATE INDEX "Announcement_scopeType_idx" ON "Announcement"("scopeType");

-- AuditLog: the sanctions/audit feeds filter by action within a time window
CREATE INDEX "AuditLog_action_timestamp_idx" ON "AuditLog"("action", "timestamp");
