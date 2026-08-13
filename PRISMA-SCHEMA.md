# Prisma Schema (draft)
### Roles & Permissions System — Rev. 2 · PostgreSQL

> Scope polymorphism note: the design doc's `scope_type + scope_value` pair is a
> polymorphic FK, which Prisma cannot enforce. It is split into **three nullable
> FK columns** (one per scope granularity) with app-level validation that exactly
> the right one is set for the `scope_type`. Same for `SanctionRule`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ────────────────────────────── Enums ──────────────────────────────

enum ScopeType {
  FACULTY      // all three scope FKs null → all sections
  PROGRAM      // programId set
  PROGRAM_YEAR // programYearId set
  SECTION      // sectionId set
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  EXCUSED
  LATE
}

enum PaymentStatus {
  PENDING
  PAID
  REJECTED
}

enum SanctionStatus {
  OPEN
  RESOLVED
}

enum FlagStatus {
  PENDING
  DISMISSED
  RESOLVED
}

enum SanctionAction {
  FLAG_FOR_REVIEW // only action in Rev. 2; enum kept for future
}

enum PeriodType {
  SEMESTER
  EVENT_SERIES
}

enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
}

enum AuditAction {
  ROLE_ASSIGNED
  ROLE_REVOKED
  SCOPE_CHANGED
  ROLE_REQUEST_REJECTED
  SANCTION_CREATED
  SANCTION_RESOLVED
  FLAG_DISMISSED
  FLAG_AUTO_DISMISSED
  PAYMENT_VERIFIED
  PAYMENT_REJECTED
}

// Fixed permission catalog (compile-time safe).
// Roles adjust via RolePermission rows only — no code change per election cycle.
enum PermissionKey {
  events_create
  events_edit
  events_delete
  events_view
  attendance_scan
  attendance_view
  attendance_edit
  transparency_upload
  transparency_delete
  transparency_view
  sanctions_create
  sanctions_view
  sanctions_view_own
  sanctions_resolve
  sanctions_appeal_respond
  fees_create
  fees_verify_payment
  fees_view
  announcements_create
  announcements_delete
  announcements_view
  users_manage_roles
  audit_view
}

// ────────────────────────── Scope structure ─────────────────────────

model Program {
  id          String      @id @default(cuid())
  code        String      @unique // "BSCS"
  name        String
  yearLevels  YearLevel[]
  sections    Section[]
}

model YearLevel {
  id         String    @id @default(cuid())
  programId  String
  level      Int       // 1-4
  program    Program   @relation(fields: [programId], references: [id])
  sections   Section[]

  @@unique([programId, level])
}

model Section {
  id             String     @id @default(cuid())
  programYearId  String
  name           String     // "A", "B", "C"
  programYear    YearLevel  @relation(fields: [programYearId], references: [id])
  students       Student[]

  @@unique([programYearId, name])
}

model Student {
  id          String     @id @default(cuid())
  studentNo   String     @unique
  firstName   String
  lastName    String
  sectionId   String?    // nullable → unassigned; excluded from all non-null scopes (§3.1)
  section     Section?   @relation(fields: [sectionId], references: [id])
  user        User?
  attendances Attendance[]
  sanctions   Sanction[]
  flags       SanctionFlag[]
  feeProofs   FeeProof[]
}

// ─────────────────────────── RBAC ────────────────────────────────

model User {
  id             String     @id @default(cuid())
  email          String     @unique
  name           String
  studentId      String?    // officer may also be a student
  student        Student?   @relation(fields: [studentId], references: [id])
  deletedAt      DateTime?  // soft-delete — audit trail survives departure
  roles          UserRole[]
  roleRequests   RoleRequest[]
  auditLogs      AuditLog[]
  createdEvents  Event[]    @relation("EventCreatedBy")
  createdFees    Fee[]      @relation("FeeCreatedBy")
  scannedAttendance Attendance[] @relation("AttendanceScannedBy")
  verifiedProofs FeeProof[] @relation("ProofVerifiedBy")
  reviewedFlags  SanctionFlag[]
  issuedSanctions    Sanction[] @relation("SanctionIssuedBy")
  resolvedSanctions  Sanction[] @relation("SanctionResolvedBy")
}

model Role {
  id          String           @id @default(cuid())
  name        String           @unique // "Super Admin", "Secretary", "Year Rep", ...
  description String?
  permissions RolePermission[]
  userRoles   UserRole[]
}

model Permission {
  id          String           @id @default(cuid())
  key         PermissionKey    @unique
  description String?
  roles       RolePermission[]
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])

  @@id([roleId, permissionId])
}

// Scope lives here, not on Role (§3). Scope enforced as a section SET
// resolved from these three FK columns at query time (§3.2).
model UserRole {
  id            String    @id @default(cuid())
  userId        String
  roleId        String
  scopeType     ScopeType // FACULTY → all three FKs null
  programId     String?   // set when scopeType = PROGRAM
  programYearId String?   // set when scopeType = PROGRAM_YEAR
  sectionId     String?   // set when scopeType = SECTION
  assignedAt    DateTime  @default(now())
  assignedBy    String    // actor user id, mirrored to AuditLog
  user          User      @relation(fields: [userId], references: [id])
  role          Role      @relation(fields: [roleId], references: [id])
  program       Program?  @relation(fields: [programId], references: [id])
  programYear   YearLevel? @relation(fields: [programYearId], references: [id])
  section       Section?  @relation(fields: [sectionId], references: [id])

  @@index([userId])
  @@index([roleId])
}

// Year/Program Rep approval flow (§10.2). Approved requests become UserRole rows.
model RoleRequest {
  id                 String        @id @default(cuid())
  userId             String
  requestedRoleId    String
  requestedScopeType ScopeType     // PROGRAM_YEAR or SECTION for Year Rep
  requestedProgramYearId String?
  requestedSectionId     String?
  status             RequestStatus @default(PENDING)
  reviewedById       String?
  reviewedAt         DateTime?
  user               User          @relation(fields: [userId], references: [id])
  requestedRole      Role          @relation(fields: [requestedRoleId], references: [id])

  @@index([status])
}

// ────────────────────────── Academic term ────────────────────────

model AcademicTerm {
  id         String     @id @default(cuid())
  name       String     @unique // "2026-27 Sem 1"
  periodType PeriodType @default(SEMESTER)
  startsOn   DateTime
  endsOn     DateTime
  isActive   Boolean    @default(false) // exactly one active term (enforced in app)
}

// ──────────────────── Events + Attendance ────────────────────────

model Event {
  id                 String       @id @default(cuid())
  title              String
  description        String?
  startsAt           DateTime
  endsAt             DateTime
  location           String?
  requiresAttendance Boolean      @default(false)
  createdById        String
  createdBy          User         @relation("EventCreatedBy", fields: [createdById], references: [id])
  attendances        Attendance[]
}

model Attendance {
  id          String           @id @default(cuid())
  eventId     String
  studentId   String
  status      AttendanceStatus @default(PRESENT)
  scannedById String?          // officer who recorded it (null for manual/offline paths)
  scannedAt   DateTime         @default(now())
  event       Event            @relation(fields: [eventId], references: [id])
  student     Student          @relation(fields: [studentId], references: [id])
  scannedBy   User?            @relation("AttendanceScannedBy", fields: [scannedById], references: [id])

  // Dedup: duplicate/offline scans cannot double-count (§8.2)
  @@unique([eventId, studentId])
  @@index([studentId])
  @@index([status])
}

// ─────────────────────────── Sanctions ───────────────────────────

model SanctionRule {
  id               String         @id @default(cuid())
  scopeType        ScopeType      @default(FACULTY) // FACULTY → all FKs null
  programId        String?
  programYearId    String?
  sectionId        String?
  absenceThreshold Int            // count of ABSENT, not excused/late
  period           PeriodType     @default(SEMESTER)
  action           SanctionAction @default(FLAG_FOR_REVIEW)
  active           Boolean        @default(true)
  program          Program?       @relation(fields: [programId], references: [id])
  programYear      YearLevel?     @relation(fields: [programYearId], references: [id])
  section          Section?       @relation(fields: [sectionId], references: [id])
  flags            SanctionFlag[]
}

model Sanction {
  id           String           @id @default(cuid())
  studentId    String
  ruleId       String?          // null = manually issued, no threshold trigger
  title        String
  reason       String
  status       SanctionStatus   @default(OPEN)
  issuedById   String?          // null = auto-issued by threshold trigger (system)
  issuedAt     DateTime         @default(now())
  resolvedById String?
  resolvedAt   DateTime?
  resolvedNote String?
  student      Student          @relation(fields: [studentId], references: [id])
  rule         SanctionRule?    @relation(fields: [ruleId], references: [id])
  issuedBy     User?            @relation("SanctionIssuedBy", fields: [issuedById], references: [id])
  resolvedBy   User?            @relation("SanctionResolvedBy", fields: [resolvedById], references: [id])
  evidences    SanctionEvidence[]
}

model SanctionEvidence {
  id           String     @id @default(cuid())
  sanctionId   String
  attendanceId String
  sanction     Sanction   @relation(fields: [sanctionId], references: [id])
  attendance   Attendance @relation(fields: [attendanceId], references: [id])

  @@unique([sanctionId, attendanceId])
}

// Resolved audit-trail flag for an auto-issued sanction (§8). One flag per (student, rule, periodRef).
model SanctionFlag {
  id           String     @id @default(cuid())
  studentId    String
  ruleId       String
  periodRef    String     // AcademicTerm.id (SEMESTER) or event-series id (EVENT_SERIES)
  triggerCount Int        // count at time of flag — evidence snapshot
  status       FlagStatus @default(PENDING)
  reviewedById String?
  reviewedAt   DateTime?
  createdAt    DateTime   @default(now())
  student      Student    @relation(fields: [studentId], references: [id])
  rule         SanctionRule @relation(fields: [ruleId], references: [id])
  reviewedBy   User?      @relation(fields: [reviewedById], references: [id])

  // §8.3 step 2 — at most one live flag per student/rule/period
  @@unique([studentId, ruleId, periodRef], where: { status: PENDING })
  @@index([status])
}

// ─────────────────────────── Fees ────────────────────────────────

model Fee {
  id          String     @id @default(cuid())
  title       String
  amount      Decimal    @db.Decimal(10, 2)
  dueDate     DateTime
  createdById String
  createdBy   User       @relation("FeeCreatedBy", fields: [createdById], references: [id])
  proofs      FeeProof[]
}

model FeeProof {
  id              String        @id @default(cuid())
  feeId           String
  studentId       String
  fileUrl         String        // image/PDF upload
  status          PaymentStatus @default(PENDING)
  rejectionReason String?       // required when REJECTED (§9 step 3)
  verifiedById    String?
  verifiedAt      DateTime?
  fee             Fee           @relation(fields: [feeId], references: [id])
  student         Student       @relation(fields: [studentId], references: [id])
  verifiedBy      User?         @relation("ProofVerifiedBy", fields: [verifiedById], references: [id])
  createdAt       DateTime      @default(now())

  // No unique on (fee, student): multiple rows = resubmit attempts; latest decides
  @@index([studentId])
  @@index([status])
}

// ───────────────────────── Transparency / Announcements ─────────────────────────

model TransparencyFile {
  id           String   @id @default(cuid())
  title        String
  fileUrl      String
  category     String?  // e.g. "events", "financial"
  uploadedById String
  uploadedBy   User     @relation(fields: [uploadedById], references: [id])
  uploadedAt   DateTime @default(now())
}

model Announcement {
  id          String   @id @default(cuid())
  title       String
  body        String
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
}

// ─────────────────────────── Audit ───────────────────────────────

// APPEND-ONLY: no update/delete API exists for this model (§11).
model AuditLog {
  id        Int         @id @default(autoincrement())
  actorId   String?     // null = system action
  action    AuditAction
  targetId  String?     // affected user/record
  details   Json        // JSON snapshot incl. names (survives soft-delete)
  timestamp DateTime    @default(now())
  actor     User?       @relation(fields: [actorId], references: [id])

  @@index([actorId])
  @@index([action])
  @@index([timestamp])
}
```

## Open questions surfaced by this schema

1. **`Attendance.scannedById` nullable** — manual entry (Secretary fixing attendance) also tied to an officer, or system-only? Left nullable for offline/manual paths.
2. **`SanctionFlag.periodRef` as a loose string** — for `EVENT_SERIES` periods, do you want an explicit `EventSeries` model, or is a string identifier enough for now?
3. **Fee resubmits** — multiple `FeeProof` rows per (fee, student) allowed so a rejected student can re-upload. Confirmed as the intended flow over "one row, mutate status."

At implementation time this content is extracted into `prisma/schema.prisma`.
