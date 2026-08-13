# Roles & Modules — Provisioning + Page Visibility
### Reference for building the UI · Rev. 2

> Every mark in the matrices below reflects a **UI visibility** decision only.
> The API enforces permissions and scope authoritatively (§3.3 of `DESIGN.md`) —
> hiding a page is never the security control.

## 1. Account Provisioning

| Role | How the account is created | Registration allowed? |
|---|---|---|
| **Super Admin** | Seed script (env-guarded, e.g. `SEED_SUPER_ADMIN_EMAIL`). Guarded: cannot be the last removed; cannot demote self. | No |
| **Secretary** | Seeded / created by Super Admin in **Users & Roles** screen. Known initial credentials. | No |
| **Treasurer** | Seeded / created by Super Admin in **Users & Roles** screen. Known initial credentials. | No |
| **Discipline Officer** | Seeded / created by Super Admin in **Users & Roles** screen. Known initial credentials. | No |
| **Year/Program Rep** | Self-register → `pending` → Super Admin **approves + assigns scope** in the same action. | Yes (requires approval) |
| **Student** | Self-register with school email → active immediately (email verified). | Yes (auto) |

### Fixed credentials (core officers)
- Super Admin, Secretary, Treasurer, Discipline Officer are **seeded DB accounts** — no open registration.
- Initial credentials are known to the org; **password change is forced on first login**.
- These roles can never be requested by a self-registering user.

### Approval flow (Year/Program Reps)
1. User registers (school email) → active as **Student**.
2. User submits a **role request** (choose scope: program+year or section).
3. Super Admin reviews in **Users & Roles** → **approve + assign scope** together, or **reject**.
4. Every approve/reject is audit-logged (`role.assigned` / `role.request_rejected`).
5. A rep is **never active without a scope** — scope is required at approval time.

## 2. Module Pages (Officers — Next.js web)

| Page / action | Super Admin | Secretary | Treasurer | Disc. Officer | Year Rep |
|---|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Events — view | ✓ | ✓ | ✓ | ✓ | ✓ |
| Events — create / edit / delete | ✓ | ✓ | — | — | ✓ own only |
| Attendance — scan | ✓ | ✓ | — | — | ✓ scoped |
| Attendance — view | ✓ | ✓ | — | ✓ | ✓ scoped |
| Attendance — edit / correct | ✓ | ✓ | — | — | — |
| Transparency — view | ✓ | ✓ | ✓ | ✓ | ✓ |
| Transparency — upload / delete | ✓ | ✓ | ✓ financial only | — | — |
| Sanctions — view | ✓ | — | — | ✓ scoped | — |
| Sanctions — view / clear / edit rules | ✓ | — | — | — | — |
| Fees — view | ✓ | — | ✓ | — | — |
| Fees — create / verify | ✓ | — | ✓ | — | — |
| Announcements — view | ✓ | ✓ | ✓ | ✓ | ✓ |
| Announcements — create / delete | ✓ | ✓ | — | — | — |
| Members (student directory) | ✓ | ✓ | ✓ | ✓ | ✓ scoped |
| Users & Roles (assign roles, approve requests) | ✓ | — | — | — | — |
| Audit Log | ✓ | — | — | — | — |

### Scope notes
- **Year Rep** rows marked "scoped" are limited to their resolved section set (`WHERE student.section_id IN (:S)`).
- **Discipline Officer** holds `attendance.view` (faculty-wide) **only** to inspect the attendance history behind a sanction flag — no other attendance surface.
- **Discipline Officer** sanctions access is **view-only** within scope; resolution (clearing) decisions rest with the **Super Admin / president**. Threshold-triggered sanctions are auto-issued and appear in the officer's view.
- **Sanction edits** (title / reason) are also restricted to the **Super Admin / president** — the Discipline Officer cannot modify records.
- **Treasurer** has no attendance access.
- **Year Rep events**: can create/edit/delete **own** events; events themselves are faculty-wide records (§3.4).

## 3. Student Surface (web + mobile)

| Page / action | Student |
|---|---|
| Dashboard (own overview) | ✓ |
| Events — view | ✓ |
| Attendance — view (own only) | ✓ |
| Transparency — view | ✓ |
| Sanctions — view own (`sanctions.view_own`) | ✓ |
| Fees — view own + upload proof of payment | ✓ |
| Announcements — view | ✓ |

Students see **no** create/edit/delete/verify controls, no directory of other students, and no sanction queue.

## 4. Seed Default Permission Sets

| Role | Permission keys |
|---|---|
| Super Admin | all keys |
| Secretary | `events.*`, `attendance.*`, `transparency.upload`, `transparency.delete`, `transparency.view`, `announcements.create`, `announcements.delete` |
| Treasurer | `fees.create`, `fees.verify_payment`, `fees.view`, `transparency.upload`, `transparency.delete`, `transparency.view` |
| Discipline Officer | `sanctions.view`, `attendance.view` (evidence review) |
| Year/Program Rep | `events.create`, `events.edit`, `events.delete`, `events.view`, `attendance.scan`, `attendance.view` |
| Student | `events.view`, `attendance.view`, `sanctions.view_own`, `fees.view`, `transparency.view`, `announcements.view`, fee proof upload capability |

> These are seed rows, tunable per election cycle without a code change — the app
> never hardcodes a role's permission set.
