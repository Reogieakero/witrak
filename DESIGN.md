# Roles & Permissions System
### Student Government Management System — Design Document (Rev. 2)

## 1. Overview

Role-Based Access Control (RBAC) with **scoping**. Each user has one or more roles; each `UserRole` assignment carries a **scope** — the portion of the student body it applies to (the whole faculty, one program, one program+year, or one section).

Two questions gate every protected action, and **both must pass**:

1. Does the user's role hold this permission?
2. Does the target record fall within the user's scope?

Scope is resolved to a **set of section IDs** and enforced **inside the database query** (`WHERE student.section_id IN (...)`). UI hiding is convenience only — the API is the gatekeeper and assumes any request may bypass the UI.

## 2. Roles

Roles are DB rows, not code. They are re-tuned each election cycle without a code change. `Super Admin` is a seeded DB role holding all permission keys — there is no hardcoded bypass.

| Role | Default Scope | Typical Holder |
|---|---|---|
| **Super Admin** | Faculty-wide | President / VP — full access, manages roles. Guarded (see §6.2) |
| **Secretary** | Faculty-wide | Events, attendance oversight, transparency uploads |
| **Treasurer** | Faculty-wide | Fees, payment verification, financial transparency files |
| **Discipline Officer** | Faculty-wide | Sanctions only (private records) |
| **Year/Program Rep** | Single scope | Events + attendance for their assigned scope |
| **Student** | Self | Read-only access to own records |

> Terminology note: this table is a **default-role listing**, not a hierarchy. No permission inheritance is implied; permission sets are assigned per role.

## 3. Scope Model

Students resolve to a **section**, which implies program + year:

```
Program     (e.g. BSCS)
YearLevel   (1, 2, 3, 4)
Section     (A, B, C)  → belongs to a Program + YearLevel
Student.section_id     (nullable — unassigned students exist; see §3.1)
```

`UserRole.scope` is stored as exactly one of:

| Scope | Storage | Covers |
|---|---|---|
| Faculty-wide | `null` | All sections |
| Whole program *(future)* | `program_id` | All years/sections of that program |
| Program + year | `program_year_id` | All sections of that year (e.g. BSCS-2) |
| Single section | `section_id` | One section (e.g. BSCS-2-A) |

`scope` lives on `UserRole`, not `Role`, because one role definition (e.g. "Year Rep") is reused across many scopes.

### 3.1 Unassigned students
Students with `section_id = null` are **excluded from every non-null scope** (scopes match by section only). They are reachable only by faculty-wide (`scope = null`) officers. This is by design and written into the enforcement pattern.

### 3.2 Resolution to a section set
At query time, a scope resolves to a **set of section IDs**:
- `null` → all sections
- `program_id` → all sections in that program
- `program_year_id` → all sections of that year
- `section_id` → that single section

Because a user may hold the same permission in multiple scopes (multiple `UserRole` rows), the resolved set is the **union** of all applicable scopes. Multi-role = union of permissions and scopes.

### 3.3 Enforcement pattern (universal)
```
1. Does the user hold permission "attendance.scan"?
2. Resolve the user's scopes for that permission → section set S   (null-scope → all)
3. Filter in the query: WHERE target.student.section_id IN (:S)
4. Both pass → allow
```
Never `= :scope`; always `IN (:S)`. Never a UI filter alone.

### 3.4 Per-module scope resolution
Two different rules exist, and which one applies depends on the module:

| Module | Scope is checked against | Notes |
|---|---|---|
| Attendance / sanctions / fee proofs | **the student's** `section_id` | The record's subject |
| Events, announcements, fees, transparency files | **nothing — faculty-wide by default** | These records have no scope column in Rev. 2 |

Events are faculty-wide: a Year Rep may *create* an event, but `attendance.scan` still limits them to students inside their section set — even at a faculty-wide event, they cannot scan outside their scope. No per-event scope is modeled.

## 4. Data Model

```
Program            id, code ("BSCS"), name
YearLevel          id, program_id, level (1-4)
Section            id, program_year_id, name ("A")
Student            id, name, section_id (nullable), ...
User               id, email, name, student_id (nullable), deleted_at (soft-delete)

Role               id, name, description
Permission         id, key, description
RolePermission     role_id, permission_id

UserRole           user_id, role_id, scope_type, scope_value, assigned_at, assigned_by
RoleRequest        user_id, requested_role_id, requested_scope, status, reviewed_by, reviewed_at

SanctionRule       id, scope, absence_threshold, period, action, active
Sanction           id, student_id, status, issued_at, resolved_by, ...
SanctionEvidence   sanction_id, attendance_id
SanctionFlag       id, student_id, rule_id, period_ref, status, trigger_count, ...

AcademicTerm       id, name, period_type, starts_on, ends_on
Event              id, title, ..., requires_attendance
Attendance         id, event_id, student_id, status, scanned_by, scanned_at
                   UNIQUE (event_id, student_id)

Fee                id, title, amount, due_date
FeeProof           id, fee_id, student_id, file_url, status, rejection_reason, ...

TransparencyFile   id, title, file_url, uploaded_by, ...
Announcement       id, title, body, created_by, ...

AuditLog           id, actor_id, action, target_id, details (JSON), timestamp
                   append-only
```

See `PRISMA-SCHEMA.md` for the full schema.

## 5. Permission Keys

```
# Events          events.create | events.edit | events.delete | events.view
# Attendance      attendance.scan | attendance.view | attendance.edit
# Transparency    transparency.upload | transparency.delete | transparency.view
# Sanctions       sanctions.create | sanctions.view | sanctions.view_own | sanctions.resolve | sanctions.appeal_respond
# Fees            fees.create | fees.verify_payment | fees.view
# Announcements   announcements.create | announcements.delete | announcements.view
# Administration  users.manage_roles | audit.view
```

- `sanctions.view_own` — a student's own sanctions (Student role). Distinct from `sanctions.view` (officer, within scope) because the two have different target-resolution logic.
- Student role default set: `attendance.view` (self), `sanctions.view_own`, `fees.view` (own proofs), `transparency.view`, plus proof-upload capability.

## 6. Super Admin — Seeded Role + Guards

1. Seeded as a DB role with every permission key. **No hardcoded bypass** — SA still passes through the same checks; its role just grants everything.
2. Guardrails (enforced at the API layer):
   - Cannot revoke `users.manage_roles` from the **last** holder.
   - Cannot demote or remove yourself.
   - Cannot delete the last active Super Admin.
3. First Super Admin is bootstrapped via a **seed script** (env-guarded, e.g. `SEED_SUPER_ADMIN_EMAIL`).
4. Keep SA count at 1–2 accounts; every SA action is audit-logged.

## 7. Sanctions — Privacy

- Visible only to: the owning student (`sanctions.view_own`) and officers holding `sanctions.view` **within scope**.
- Never in public lists, aggregates, or leaderboards.
- `sanctions.view` still respects scope — a Year Rep cannot see sanctions for students outside their section set, even though they hold the key.
- Sanctions are issued automatically on threshold and cleared by the admin / president; the flag audit trail (§8) is equally private — officers only.

## 8. Sanctions — Absence Threshold Trigger

### 8.1 Attendance statuses
Every `Attendance` row has `status ∈ {present, absent, excused, late}`. Only `absent` counts toward a threshold. `excused` is exempt.

### 8.2 Dedup
`UNIQUE (event_id, student_id)` on `Attendance` — duplicate/offline scans cannot double-count.

### 8.3 Flow (auto-issue on threshold, cleared on fulfillment)
1. On every attendance write (scan, manual, or **offline sync batch**), **recompute** the student's `absent` count for the current `AcademicTerm` (per rule `period`). Never increment — recompute, so corrections self-heal.
2. Match the most specific applicable active `SanctionRule` (see §8.4). If `count >= threshold` and the student has **no existing sanction or flag** for the term yet, **auto-issue** the sanction:
   - Create a `Sanction` (status `open`) with the triggering attendance rows attached as `SanctionEvidence`, and
   - Create a `SanctionFlag` (status `resolved`) as the audit trail. `Sanction.issuedById` and the audit log actor are `null` — system-issued.
   - **One sanction per student**: the dedup is keyed on the student, not the rule — a student is issued a single sanction under the single best-matching rule. Adding or editing rules never stacks a second sanction on a student who already has one.
3. When the student fulfills the requirement, the **admin / president clicks "Cleared"** (`sanctions.resolve`): the sanction flips to `resolved` with `resolvedNote = "Cleared"` and a `SANCTION_RESOLVED` audit entry. There is no pending queue and no appeal/upheld workflow — a single transaction clears the record. Officers view records; the discipline officer is view-only.
4. **Adding or editing an active rule backfills.** After a rule is created or updated active, a recompute pass runs across every student in the rule's scope, so students who already meet the new/relaxed threshold are immediately auto-issued — no attendance write required. Idempotent per student, so repeats never duplicate and students with an existing sanction are never re-issued.
5. **Admin / president may edit a sanction's title and reason** (gated by `sanctions.create`). The absences, rule, evidence, and outcome are fixed — edits update only the free-text fields. The same gate covers **rule management**: the admin can add, edit (threshold/scope/period/active), toggle, and delete sanction rules from the right-hand sidebar. Deleting a rule **cascades** to its dependent data in a single transaction: the rule's `SanctionEvidence`, `Sanction` records, and `SanctionFlag` records are deleted with it.
6. **Edits and excusals re-trigger recompute.** Because auto-issue is idempotent per (student, rule, period), a corrected count never creates duplicates or double-issues.

### 8.4 Rule precedence
Among matching active rules, the **most specific scope wins** (section > program_year > program > faculty). Ties on scope: the **highest threshold ≤ count** wins; then `period` (current-term match preferred). Graduated responses are modeled as multiple rules; in Rev. 2 every rule's `action` is `flag_for_review`, and the recompute **auto-issues one sanction per student** — the single best-matching rule (`threshold ≤ absences`) — when it is met; clearing it is a single admin action.

### 8.5 Offline sync (QR)
When the mobile app syncs a scanned batch, the threshold recompute runs as **one pass after sync completes**, spanning the whole batch plus the server-side dedup — so a duplicate offline scan can't double-flag.

## 9. Fees — Manual Verification Flow

1. Treasurer creates a `Fee` (title, amount, due date). Faculty-wide; no fee scope in Rev. 2.
2. Student uploads proof of payment (image/PDF) → status `pending`.
3. `fees.verify_payment` holder (Treasurer, or delegated scoped officer) approves/rejects. Rejection requires a **reason** field.
4. Status → `paid` or `rejected`. Verification is audit-logged.

## 10. Account Provisioning

### 10.1 Fixed credentials (seeded — no self-registration)
**Super Admin, Secretary, Treasurer, Discipline Officer** are seeded DB accounts with known initial credentials. No open registration for these roles.

- Accounts are created by the seed script (Super Admin) and by the Super Admin in the "Users & Roles" screen (Secretary / Treasurer / Discipline Officer).
- Initial credentials are known to the org; **password change is forced on first login**.
- These roles are never requestable by a self-registering user.

### 10.2 Approval flow (Year / Program Representatives)
1. User self-registers with a school email → account active immediately as **Student** role.
2. User submits a **role request** for Year/Program Rep, choosing the requested scope (program+year or section).
3. Super Admin reviews in the "Users & Roles" screen and **approves + assigns the scope in the same action** — a rep is never active without a scope — or rejects.
4. Every approve/reject is audit-logged (`role.assigned` / `role.request_rejected`).

### 10.3 Students
Self-register with school email → active immediately as Student role (email verified). Only officer role requests require approval.

## 11. Audit Trail

`AuditLog` rows are **append-only** (no update/delete API). Minimum events:
- Role assigned / revoked / scope changed / role request rejected
- Sanction created / resolved / flag dismissed / flag auto-dismissed
- Fee payment verified / rejected
- Super Admin actions (implicit via the above + `audit.view` gating)

`details` holds a JSON snapshot of what changed (including names, for records that may later be soft-deleted).

## 12. Module Pages per Role

See `ROLES-AND-MODULES.md` for the full matrix and page-level detail. Summary:

- **Super Admin** — every page (Dashboard, Events, Attendance, Transparency, Sanctions, Fees, Announcements, Members, Users & Roles, Audit Log).
- **Secretary** — Events (full), Attendance (scan/view/edit), Transparency (upload/delete), Announcements (create/delete), Members.
- **Treasurer** — Fees (create/verify), Transparency (financial files only), Members. No attendance.
- **Discipline Officer** — Sanctions **view only** (scoped; issuance/resolution decisions rest with the Super Admin / president) + `attendance.view` (faculty-wide) solely to inspect sanction evidence. Nothing else.
- **Year/Program Rep** — Events (create/edit/delete own), Attendance (scan/view, scoped), Members (scoped).
- **Student** — Events view, Attendance view (own), Transparency view, Sanctions view-own, Fees view + upload proof, Announcements view.

All page visibility is UI convenience only — the API enforces permissions and scope authoritatively.

## 13. Implementation Notes (Next.js + React Native)

1. **Soft-delete users.** Audit and `assigned_by` must survive officer departures. Hard delete destroys the trail; preserve names in `AuditLog.details`.
2. **Session/JWT.** Embed resolved `roles`, `permissions`, and resolved scope **section-sets** in the session callback / mobile JWT. **Staleness mitigation:** role churn is frequent (election cycles), so use short-lived access tokens + refresh strategy, and keep server-side scope re-checks where cheap. A revoked officer must not retain access until an old token expires — treat revocation as revoke-on-refresh at minimum.
3. **Mobile surface.** Expo app is mostly QR scanning for officers. Minimal check: `attendance.scan` (+ scope). Offline queue per §8.5.
4. **Rotation-friendly.** Build the in-app "Assign Role" / "Approve Role Requests" screens (Super Admin) early; no DB scripts for routine role management.

## 14. Open Items (next passes)

- [ ] Full Prisma schema (all models, incl. `Program/YearLevel/Section`, `SanctionFlag`, `SanctionEvidence`, `AcademicTerm`, `RoleRequest`) — see `PRISMA-SCHEMA.md`
- [ ] QR attendance flow detail — scan → API → recompute → offline queue/sync semantics
- [ ] Folder structure for the Next.js + Expo codebase
- [ ] Excused-absence handling — who marks `excused` (Secretary? Discipline Officer?) and any scope limit on doing so
- [ ] Academic-year rollover — normalize now (§3 makes it possible); design the promotion + stale-scope cleanup process later
