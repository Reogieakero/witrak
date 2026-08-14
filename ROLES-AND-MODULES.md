# Roles & Modules — Provisioning + Page Visibility
### Reference for building the UI · Rev. 3

> Every mark in the matrices below reflects a **UI visibility** decision only.
> The API enforces permissions and scope authoritatively (§3.3 of `DESIGN.md`) —
> hiding a page is never the security control.
>
> This revision reflects the roles and permission sets actually seeded in
> `packages/db/prisma/seed.ts` and the `hasPermission` gates in the admin pages.

## 1. Account Provisioning

| Role | How the account is created | Registration allowed? |
|---|---|---|
| **Super Admin** | Seed script (env-guarded, e.g. `SEED_SUPER_ADMIN_EMAIL`). Guarded: cannot be the last removed; cannot demote self. | No |
| **Secretary** | Seeded / created by Super Admin in **Users & Roles** screen. Known initial credentials. | No |
| **Treasurer** | Seeded / created by Super Admin in **Users & Roles** screen. Known initial credentials. | No |
| **Discipline Officer** | Seeded / created by Super Admin in **Users & Roles** screen. Known initial credentials. | No |
| **Vice President** | Seeded / created by Super Admin in **Users & Roles** screen. | No |
| **PIO** (Public Information Officer) | Seeded / created by Super Admin in **Users & Roles** screen. | No |
| **Auditor** | Seeded / created by Super Admin in **Users & Roles** screen. | No |
| **Adviser** (Faculty) | Seeded / created by Super Admin in **Users & Roles** screen. | No |
| **Year/Program Rep** | Self-register → `pending` → Super Admin **approves + assigns scope** in the same action. | Yes (requires approval) |
| **Student** | Self-register with school email → active immediately (email verified). | Yes (auto) |

### Fixed credentials (core officers)
- Super Admin, Secretary, Treasurer, Discipline Officer, Vice President, PIO, Auditor, and Adviser are **seeded DB accounts** — no open registration.
- Initial credentials are known to the org; **password change is forced on first login**.
- These roles can never be requested by a self-registering user.

### Approval flow (Year/Program Reps)
1. User registers (school email) → active as **Student**.
2. User submits a **role request** (choose scope: program+year or section).
3. Super Admin reviews in **Users & Roles** → **approve + assign scope** together, or **reject**.
4. Every approve/reject is audit-logged (`role.assigned` / `role.request_rejected`).
5. A rep is **never active without a scope** — scope is required at approval time.

## 2. Module Pages (Officers — Next.js web)

Legend: **✓** full access · **view** view-only · **own** own-scope only · **SA** Super Admin only · **—** no access.

| Page / action | Super Admin | Secretary | Treasurer | Disc. Officer | Year Rep | VP | PIO | Auditor | Adviser |
|---|---|---|---|---|---|---|---|---|---|
| Dashboard (officer) | ✓ | — | — | — | — | — | — | — | — |
| Events — view | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Events — create / edit / delete | ✓ | ✓ | — | — | ✓ own | ✓ | — | — | — |
| Attendance — scan | ✓ | ✓ | — | — | ✓ scoped | — | — | — | — |
| Attendance — view | ✓ | ✓ | — | ✓ | ✓ scoped | ✓ | — | — | ✓ |
| Attendance — edit / correct | ✓ | ✓ | — | — | — | — | — | — | — |
| Transparency — view | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Transparency — upload / delete | ✓ | ✓ | ✓ (financial) | — | — | — | ✓ | — | — |
| Sanctions — view | ✓ | — | — | ✓ scoped | — | — | — | — | — |
| Sanctions — create / clear / edit rules | ✓ | — | — | — | — | — | — | — | — |
| Fees — view | ✓ | — | ✓ | — | — | — | — | ✓ | — |
| Fees — create / verify | ✓ | — | ✓ | — | — | — | — | — | — |
| Announcements — view | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Announcements — create / edit / delete | ✓ | ✓ | — | — | — | ✓ | ✓ | — | — |
| Members (student directory) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Students (account management) | SA | — | — | — | — | — | — | — | — |
| Users & Roles (assign roles, approve requests) | SA | — | — | — | — | — | — | — | — |
| Terms | SA | — | — | — | — | — | — | — | — |
| Programs | SA | — | — | — | — | — | — | — | — |
| Payment Methods | SA | — | — | — | — | — | — | — | — |
| Audit Log | ✓ | — | — | — | — | — | ✓ | ✓ | ✓ |

### Role scope notes
- **Super Admin** is the only role that holds `users_manage_roles` — it exclusively owns the **Users & Roles**, **Students**, **Terms**, **Programs**, and **Payment Methods** management screens, and the officer **Dashboard** (the `/admin/dashboard` landing).
- **Year Rep** rows marked "scoped" are limited to their resolved section set (`WHERE student.section_id IN (:S)`).
- **Discipline Officer** holds `attendance.view` (faculty-wide) **only** to inspect the attendance history behind a sanction flag — no other attendance surface. Sanctions access is **view-only** within scope; creation/clearing/editing rest with the **Super Admin**. Threshold-triggered sanctions are auto-issued and appear in the officer's view.
- **Treasurer** has no attendance or announcements access; transparency upload is financial files only (UI scope, not a separate permission).
- **Vice President** covers events (create/edit/delete) + attendance *view* + transparency *view* + announcements (create/delete) + directory — but **cannot scan** attendance.
- **PIO** publishes: transparency (upload/delete) + announcements (create/edit/delete), with view access to events and the directory.
- **Auditor** reviews records: `fees.view`, `transparency.view`, `audit.view`, plus read access to announcements/events/directory.
- **Adviser** is read-only oversight: `transparency.view`, `audit.view`, `announcements.view`, `events.view`, `attendance.view`, `members.view`.

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

> Student self-service (fee-proof upload, own attendance/sanctions/fees) is delivered primarily through the **mobile app**; the web `/dashboard` currently reuses the officer `DashboardView`. The capability boundary above is enforced by the Student permission set, regardless of surface.

## 4. Seed Default Permission Sets

| Role | Permission keys |
|---|---|
| Super Admin | all keys |
| Secretary | `events.*`, `attendance.scan`, `attendance.view`, `attendance.edit`, `transparency.upload`, `transparency.delete`, `transparency.view`, `announcements.create`, `announcements.edit`, `announcements.delete`, `announcements.view`, `members.view` |
| Treasurer | `fees.create`, `fees.verify_payment`, `fees.view`, `transparency.upload`, `transparency.delete`, `transparency.view`, `members.view` |
| Discipline Officer | `sanctions.view`, `attendance.view` (evidence review), `members.view` |
| Year/Program Rep | `events.create`, `events.edit`, `events.delete`, `events.view`, `attendance.scan`, `attendance.view`, `members.view` |
| Vice President | `events.create`, `events.edit`, `events.delete`, `events.view`, `attendance.view`, `transparency.view`, `announcements.create`, `announcements.delete`, `announcements.view`, `members.view` |
| PIO | `transparency.upload`, `transparency.delete`, `transparency.view`, `announcements.create`, `announcements.edit`, `announcements.delete`, `announcements.view`, `events.view`, `members.view` |
| Auditor | `fees.view`, `transparency.view`, `audit.view`, `announcements.view`, `events.view`, `members.view` |
| Adviser | `transparency.view`, `audit.view`, `announcements.view`, `events.view`, `attendance.view`, `members.view` |
| Student | `events.view`, `attendance.view`, `sanctions.view_own`, `fees.view`, `transparency.view`, `announcements.view`, fee proof upload capability |

> These are seed rows, tunable per election cycle without a code change — the app
> never hardcodes a role's permission set.
