import {
  Prisma,
  PrismaClient,
  AuditAction,
  AttendanceStatus,
  FlagStatus,
  PaymentStatus,
  PeriodType,
  PermissionKey,
  RequestStatus,
  SanctionStatus,
  ScopeType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type RoleSeed = {
  name: string;
  description: string;
  permissions: PermissionKey[];
};

const ROLE_SEEDS: RoleSeed[] = [
  {
    name: "Super Admin",
    description: "Faculty-wide full access; manages roles. Guarded against lockout.",
    permissions: Object.values(PermissionKey),
  },
  {
    name: "Secretary",
    description: "Events, attendance oversight, transparency uploads, announcements.",
    permissions: [
      PermissionKey.events_create,
      PermissionKey.events_edit,
      PermissionKey.events_delete,
      PermissionKey.events_view,
      PermissionKey.attendance_scan,
      PermissionKey.attendance_view,
      PermissionKey.attendance_edit,
      PermissionKey.transparency_upload,
      PermissionKey.transparency_delete,
      PermissionKey.transparency_view,
      PermissionKey.announcements_create,
      PermissionKey.announcements_edit,
      PermissionKey.announcements_delete,
      PermissionKey.announcements_view,
      PermissionKey.members_view,
    ],
  },
  {
    name: "Treasurer",
    description: "Fees, payment verification, financial transparency files.",
    permissions: [
      PermissionKey.fees_create,
      PermissionKey.fees_verify_payment,
      PermissionKey.fees_view,
      PermissionKey.transparency_upload,
      PermissionKey.transparency_delete,
      PermissionKey.transparency_view,
      PermissionKey.members_view,
    ],
  },
  {
    name: "Discipline Officer",
    description: "Sanctions view within scope (decisions rest with the admin/president) + attendance view for evidence.",
    permissions: [
      PermissionKey.sanctions_view,
      PermissionKey.attendance_view,
      PermissionKey.members_view,
    ],
  },
  {
    name: "Year/Program Rep",
    description: "Events + attendance for their assigned scope.",
    permissions: [
      PermissionKey.events_create,
      PermissionKey.events_edit,
      PermissionKey.events_delete,
      PermissionKey.events_view,
      PermissionKey.attendance_scan,
      PermissionKey.attendance_view,
      PermissionKey.members_view,
    ],
  },
  {
    name: "Student",
    description: "Read-only access to own records.",
    permissions: [
      PermissionKey.events_view,
      PermissionKey.attendance_view,
      PermissionKey.sanctions_view_own,
      PermissionKey.fees_view,
      PermissionKey.transparency_view,
      PermissionKey.announcements_view,
    ],
  },
  {
    name: "Vice President",
    description: "Assists the president across operations and announcements.",
    permissions: [
      PermissionKey.events_create,
      PermissionKey.events_edit,
      PermissionKey.events_delete,
      PermissionKey.events_view,
      PermissionKey.attendance_view,
      PermissionKey.transparency_view,
      PermissionKey.announcements_create,
      PermissionKey.announcements_delete,
      PermissionKey.announcements_view,
      PermissionKey.members_view,
    ],
  },
  {
    name: "PIO",
    description: "Public Information Officer — publishes announcements and transparency files.",
    permissions: [
      PermissionKey.transparency_upload,
      PermissionKey.transparency_delete,
      PermissionKey.transparency_view,
      PermissionKey.announcements_create,
      PermissionKey.announcements_edit,
      PermissionKey.announcements_delete,
      PermissionKey.announcements_view,
      PermissionKey.events_view,
      PermissionKey.members_view,
    ],
  },
  {
    name: "Auditor",
    description: "Reviews fee records and the audit trail.",
    permissions: [
      PermissionKey.fees_view,
      PermissionKey.transparency_view,
      PermissionKey.audit_view,
      PermissionKey.announcements_view,
      PermissionKey.events_view,
      PermissionKey.members_view,
    ],
  },
  {
    name: "Adviser",
    description: "Faculty adviser with read-only oversight.",
    permissions: [
      PermissionKey.transparency_view,
      PermissionKey.audit_view,
      PermissionKey.announcements_view,
      PermissionKey.events_view,
      PermissionKey.attendance_view,
      PermissionKey.members_view,
    ],
  },
];

const FIRST_NAMES = [
  "Juan", "Maria", "Jose", "Ana", "Pedro", "Sofia", "Miguel", "Elena",
  "Andres", "Luz", "Carlos", "Rosa", "Ramon", "Carmen", "Dante", "Lorna",
  "Nestor", "Divina", "Rafael", "Gloria", "Emilio", "Perla", "Bienvenido", "Corazon",
];
const LAST_NAMES = [
  "Dela Cruz", "Santos", "Reyes", "Garcia", "Mendoza", "Flores", "Aquino",
  "Villanueva", "Bautista", "Salazar", "Ramos", "Torres", "Lim", "Castillo",
  "Gonzales", "Navarro", "Pascual", "Domingo", "Ortega", "Vargas", "Lopez",
  "Santiago", "Cabrera", "Mercado",
];

const PROGRAMS = [
  {
    code: "AB-POLSCI",
    name: "AB Political Science",
  },
  {
    code: "BSPSYCH",
    name: "BS Psychology",
  },
  {
    code: "BS-DEVCOM",
    name: "BS Development Communication",
  },
];

const EVENTS = [
  { title: "Freshman Orientation", location: "Main Hall", requiresAttendance: true },
  { title: "Oath Taking Ceremony", location: "University Gym", requiresAttendance: true },
  { title: "Foundation Day Fun Run", location: "Gym Oval", requiresAttendance: true },
  { title: "GAD Talk Series #1", location: "Auditorium B", requiresAttendance: true },
  { title: "Blood Donation Drive", location: "Covered Court", requiresAttendance: true },
  { title: "Intramurals Opening", location: "Sports Complex", requiresAttendance: true },
  { title: "General Assembly", location: "Main Hall", requiresAttendance: false },
  { title: "Charity Bazaar", location: "Open Grounds", requiresAttendance: true },
  { title: "Academic Week", location: "Multiple Venues", requiresAttendance: true },
  { title: "Leadership Summit", location: "Audio-Visual Room", requiresAttendance: true },
  { title: "Cleanup Drive", location: "Campus", requiresAttendance: true },
  { title: "Community Outreach", location: "Barangay Hall", requiresAttendance: true },
  { title: "Sports Meet Finals", location: "Sports Complex", requiresAttendance: true },
  { title: "Recognition Night", location: "Main Hall", requiresAttendance: false },
];

const FEES = [
  { title: "Membership Fee", amount: 100.0, due: "2025-09-30" },
  { title: "Semester Fee", amount: 1850.0, due: "2025-10-31" },
  { title: "Laboratory Fee", amount: 950.0, due: "2025-11-15" },
  { title: "Foundation Day Contribution", amount: 150.0, due: "2025-12-15" },
  { title: "School ID Fee", amount: 120.0, due: "2025-10-15" },
  { title: "Intramurals Fee", amount: 200.0, due: "2025-11-30" },
  { title: "Yearbook Fee", amount: 300.0, due: "2026-01-31" },
  { title: "Charity Fund", amount: 50.0, due: "2025-12-20" },
  { title: "Activity Fee", amount: 250.0, due: "2025-11-10" },
  { title: "Newsletter Fee", amount: 75.0, due: "2026-01-15" },
];

const TRANSPARENCY_FILES = [
  { title: "Semester 1 Budget Report", category: "financial" },
  { title: "Treasurer's Report — October", category: "financial" },
  { title: "Fund Allocation FY 2025", category: "financial" },
  { title: "Disbursement Summary — Q1", category: "financial" },
  { title: "Collection Report — Semester Fee", category: "financial" },
  { title: "Foundation Day Program", category: "events" },
  { title: "Intramurals Official Schedule", category: "events" },
  { title: "Oath Taking Ceremony Program", category: "events" },
  { title: "GAD Talk Series Topics", category: "events" },
  { title: "General Assembly Minutes", category: "minutes" },
  { title: "Officers' Meeting Minutes — Nov", category: "minutes" },
  { title: "Annual Org Report", category: "reports" },
];

const ANNOUNCEMENTS = [
  { title: "Welcome to AY 2025-2026!", body: "Orientation schedule and org events for the new academic year are now live." },
  { title: "Semester Fee Payment Deadline", body: "Pay your semester fee on or before October 31 to avoid penalties." },
  { title: "Foundation Day Fun Run — Registration Open", body: "Sign up at the org booth or via the portal. QR attendance required." },
  { title: "GAD Talk Series #1", body: "Join us at Auditorium B. Open to all students." },
  { title: "Blood Donation Drive — Volunteer Slots", body: "Volunteers needed for the blood donation drive this Friday." },
  { title: "Intramurals Season Opens", body: "Cheer for your sections! Intramurals opening day at the Sports Complex." },
  { title: "General Assembly This Friday", body: "State of the org address by the President. Attendance encouraged." },
  { title: "Charity Bazaar Vendor Slots", body: "Student organizations may reserve a booth for the charity bazaar." },
  { title: "Leadership Summit Registrations", body: "Officer leadership summit — limited slots, register early." },
  { title: "Cleanup Drive Volunteers", body: "Join the campus cleanup drive and earn service hours." },
  { title: "Sports Meet Finals Schedule", body: "Championship games schedule for the sports meet finals." },
  { title: "Recognition Night — Awardees", body: "List of awardees for the Recognition Night is out. See transparency files." },
];

async function seedPermissions(): Promise<void> {
  for (const key of Object.values(PermissionKey)) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key },
    });
  }
}

async function seedRoles(): Promise<void> {
  for (const seed of ROLE_SEEDS) {
    const role = await prisma.role.upsert({
      where: { name: seed.name },
      update: { description: seed.description },
      create: { name: seed.name, description: seed.description },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const key of seed.permissions) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
}

async function seedSuperAdmin(): Promise<{ id: string; name: string; email: string }> {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const name = process.env.SEED_SUPER_ADMIN_NAME ?? "President";

  if (!email || !password) {
    throw new Error("SEED_SUPER_ADMIN_EMAIL / SEED_SUPER_ADMIN_PASSWORD not set.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const role = await prisma.role.findUniqueOrThrow({ where: { name: "Super Admin" } });

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  });

  const existing = await prisma.userRole.findFirst({
    where: { userId: user.id, roleId: role.id },
  });
  if (!existing) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        scopeType: ScopeType.FACULTY,
        assignedBy: user.id,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: AuditAction.ROLE_ASSIGNED,
      targetId: user.id,
      details: { role: "Super Admin", scopeType: "FACULTY" },
    },
  });

  console.log(`Super Admin ready: ${email}`);
  return { id: user.id, name, email };
}

async function wipeMockData(): Promise<void> {
  console.log("Clearing previous mock data…");
  await prisma.auditLog.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.transparencyFile.deleteMany({});
  await prisma.feeProof.deleteMany({});
  await prisma.fee.deleteMany({});
  await prisma.sanctionEvidence.deleteMany({});
  await prisma.sanction.deleteMany({});
  await prisma.sanctionFlag.deleteMany({});
  await prisma.sanctionRule.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.academicTerm.deleteMany({});
  await prisma.roleRequest.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.yearLevel.deleteMany({});
  await prisma.program.deleteMany({});
}

function studentNameFor(i: number): { firstName: string; lastName: string } {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
  return { firstName: first, lastName: last };
}

async function seedScopeStructure(): Promise<{
  sections: Awaited<ReturnType<typeof prisma.section.findMany>>;
  yearLevels: Awaited<ReturnType<typeof prisma.yearLevel.findMany>>;
  programs: Awaited<ReturnType<typeof prisma.program.findMany>>;
  students: Awaited<ReturnType<typeof prisma.student.findMany>>;
}> {
  await prisma.program.createMany({ data: PROGRAMS });
  const programs = await prisma.program.findMany();

  const yearLevels: { programId: string; level: number }[] = [];
  for (const p of programs) {
    for (let level = 1; level <= 4; level++) {
      yearLevels.push({ programId: p.id, level });
    }
  }
  await prisma.yearLevel.createMany({ data: yearLevels });
  const yearLevelRows = await prisma.yearLevel.findMany();

  const sections: { programYearId: string; name: string }[] = [];
  for (const yl of yearLevelRows) {
    const names = yl.level <= 2 ? ["A", "B"] : ["A"];
    for (const name of names) {
      sections.push({ programYearId: yl.id, name });
    }
  }
  await prisma.section.createMany({ data: sections });
  const sectionRows = await prisma.section.findMany();

  // Students: 3 per section + a handful unassigned
  const students: {
    studentNo: string;
    firstName: string;
    lastName: string;
    sectionId?: string | null;
  }[] = [];
  let idx = 0;
  for (const section of sectionRows) {
    for (let n = 0; n < 3; n++) {
      const name = studentNameFor(idx);
      students.push({
        studentNo: `2025-${String(idx + 1).padStart(4, "0")}`,
        firstName: name.firstName,
        lastName: name.lastName,
        sectionId: section.id,
      });
      idx++;
    }
  }
  for (let n = 0; n < 6; n++) {
    const name = studentNameFor(idx);
    students.push({
      studentNo: `2025-${String(idx + 1).padStart(4, "0")}`,
      firstName: name.firstName,
      lastName: name.lastName,
      sectionId: null,
    });
    idx++;
  }
  await prisma.student.createMany({ data: students });
  const studentRows = await prisma.student.findMany();

  console.log(
    `Scope structure: ${programs.length} programs, ${yearLevelRows.length} year levels, ${sectionRows.length} sections, ${studentRows.length} students`,
  );
  return { sections: sectionRows, yearLevels: yearLevelRows, programs, students: studentRows };
}

async function seedUsers(
  superAdmin: { id: string },
  students: Awaited<ReturnType<typeof prisma.student.findMany>>,
  yearLevels: Awaited<ReturnType<typeof prisma.yearLevel.findMany>>,
  sections: Awaited<ReturnType<typeof prisma.section.findMany>>,
): Promise<{
  secretary: { id: string };
  treasurer: { id: string };
  disciplineOfficer: { id: string };
  scanners: { id: string }[];
}> {
  const passwordHash = await bcrypt.hash("password123", 10);
  const roleCache = new Map<string, string>();
  async function roleId(name: string): Promise<string> {
    let id = roleCache.get(name);
    if (!id) {
      const role = await prisma.role.findUniqueOrThrow({ where: { name } });
      id = role.id;
      roleCache.set(name, id);
    }
    return id;
  }

  const officerSpecs = [
    { email: "secretary@fhusocom.edu", name: "Karla Ramirez", role: "Secretary" },
    { email: "treasurer@fhusocom.edu", name: "Dexter Lim", role: "Treasurer" },
    { email: "discipline.officer@fhusocom.edu", name: "Riza Bautista", role: "Discipline Officer" },
    { email: "vp@fhusocom.edu", name: "Miguel Torres", role: "Vice President" },
    { email: "pio@fhusocom.edu", name: "Nina Santos", role: "PIO" },
    { email: "auditor@fhusocom.edu", name: "Paolo Mendoza", role: "Auditor" },
    { email: "adviser@fhusocom.edu", name: "Prof. Agnes Rivera", role: "Adviser" },
  ];

  const created: { id: string }[] = [];
  for (const spec of officerSpecs) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: { name: spec.name, passwordHash },
      create: { email: spec.email, name: spec.name, passwordHash },
    });
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: await roleId(spec.role),
        scopeType: ScopeType.FACULTY,
        assignedBy: superAdmin.id,
      },
    });
    created.push(user);
  }

  const secretary = created[0];
  const treasurer = created[1];
  const disciplineOfficer = created[2];

  // Year/Program reps (student-linked, scoped)
  const repSpecs = [
    { email: "yearep1@fhusocom.edu", name: "Aila Reyes", studentIdx: 0, scope: ScopeType.PROGRAM_YEAR, target: yearLevels[1] },
    { email: "yearep2@fhusocom.edu", name: "Bryan Cruz", studentIdx: 1, scope: ScopeType.SECTION, target: sections[2] },
    { email: "yearep3@fhusocom.edu", name: "Celine Aquino", studentIdx: 2, scope: ScopeType.PROGRAM_YEAR, target: yearLevels[7] },
    { email: "yearep4@fhusocom.edu", name: "Dino Salazar", studentIdx: 3, scope: ScopeType.SECTION, target: sections[5] },
  ] as const;

  const repRoleId = await roleId("Year/Program Rep");
  const scanners: { id: string }[] = [secretary];
  for (const spec of repSpecs) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: { name: spec.name, passwordHash },
      create: { email: spec.email, name: spec.name, passwordHash, studentId: students[spec.studentIdx].id },
    });
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: repRoleId,
        scopeType: spec.scope,
        programYearId: spec.scope === ScopeType.PROGRAM_YEAR ? (spec.target as { id: string }).id : undefined,
        sectionId: spec.scope === ScopeType.SECTION ? (spec.target as { id: string }).id : undefined,
        assignedBy: superAdmin.id,
      },
    });
    scanners.push(user);
  }

  // Plain student users (source of role requests)
  const studentRoleId = await roleId("Student");
  const studentUserSpecs = [
    { email: "student1@fhusocom.edu", name: "Elaine Lopez", studentIdx: 4 },
    { email: "student2@fhusocom.edu", name: "Francis Torres", studentIdx: 5 },
    { email: "student3@fhusocom.edu", name: "Gina Navarro", studentIdx: 6 },
    { email: "student4@fhusocom.edu", name: "Harold Pascual", studentIdx: 7 },
    { email: "student5@fhusocom.edu", name: "Iris Domingo", studentIdx: 8 },
    { email: "student6@fhusocom.edu", name: "Jerome Ortega", studentIdx: 9 },
  ];
  for (const spec of studentUserSpecs) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: { name: spec.name, passwordHash },
      create: { email: spec.email, name: spec.name, passwordHash, studentId: students[spec.studentIdx].id },
    });
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: studentRoleId,
        scopeType: ScopeType.FACULTY,
        assignedBy: superAdmin.id,
      },
    });
  }

  return { secretary, treasurer, disciplineOfficer, scanners };
}

async function seedRoleRequests(
  superAdmin: { id: string },
  students: Awaited<ReturnType<typeof prisma.student.findMany>>,
  yearLevels: Awaited<ReturnType<typeof prisma.yearLevel.findMany>>,
  sections: Awaited<ReturnType<typeof prisma.section.findMany>>,
): Promise<void> {
  const repRole = await prisma.role.findUniqueOrThrow({ where: { name: "Year/Program Rep" } });
  const studentUsers = await prisma.user.findMany({
    where: { email: { startsWith: "student" } },
    orderBy: { email: "asc" },
  });

  const specs = [
    { userIdx: 0, status: RequestStatus.PENDING, scope: ScopeType.PROGRAM_YEAR, target: yearLevels[4] },
    { userIdx: 1, status: RequestStatus.PENDING, scope: ScopeType.SECTION, target: sections[8] },
    { userIdx: 2, status: RequestStatus.PENDING, scope: ScopeType.PROGRAM_YEAR, target: yearLevels[10] },
    { userIdx: 3, status: RequestStatus.PENDING, scope: ScopeType.SECTION, target: sections[12] },
    { userIdx: 4, status: RequestStatus.PENDING, scope: ScopeType.PROGRAM_YEAR, target: yearLevels[11] },
    { userIdx: 5, status: RequestStatus.APPROVED, scope: ScopeType.PROGRAM_YEAR, target: yearLevels[3] },
    { userIdx: 0, status: RequestStatus.APPROVED, scope: ScopeType.SECTION, target: sections[1] },
    { userIdx: 2, status: RequestStatus.APPROVED, scope: ScopeType.SECTION, target: sections[0] },
    { userIdx: 3, status: RequestStatus.REJECTED, scope: ScopeType.PROGRAM_YEAR, target: yearLevels[8] },
    { userIdx: 4, status: RequestStatus.REJECTED, scope: ScopeType.SECTION, target: sections[6] },
    { userIdx: 5, status: RequestStatus.REJECTED, scope: ScopeType.PROGRAM_YEAR, target: yearLevels[7] },
    { userIdx: 1, status: RequestStatus.REJECTED, scope: ScopeType.SECTION, target: sections[4] },
  ] as const;

  for (const spec of specs) {
    const isRejected = spec.status === RequestStatus.REJECTED;
    await prisma.roleRequest.create({
      data: {
        userId: studentUsers[spec.userIdx].id,
        requestedRoleId: repRole.id,
        requestedScopeType: spec.scope,
        requestedProgramYearId:
          spec.scope === ScopeType.PROGRAM_YEAR ? (spec.target as { id: string }).id : undefined,
        requestedSectionId: spec.scope === ScopeType.SECTION ? (spec.target as { id: string }).id : undefined,
        status: spec.status,
        reviewedById: spec.status === RequestStatus.PENDING ? null : superAdmin.id,
        reviewedAt: spec.status === RequestStatus.PENDING ? null : new Date("2026-01-09T10:00:00Z"),
      },
    });
  }
  void students;
}

async function seedAcademicTerms(): Promise<{ activeTermId: string; terms: Awaited<ReturnType<typeof prisma.academicTerm.findMany>> }> {
  const terms = [
    { name: "2021-22 Sem 1", start: "2021-08-01", end: "2021-12-15" },
    { name: "2021-22 Sem 2", start: "2022-01-10", end: "2022-05-15" },
    { name: "2022-23 Sem 1", start: "2022-08-01", end: "2022-12-15" },
    { name: "2022-23 Sem 2", start: "2023-01-10", end: "2023-05-15" },
    { name: "2023-24 Sem 1", start: "2023-08-01", end: "2023-12-15" },
    { name: "2023-24 Sem 2", start: "2024-01-10", end: "2024-05-15" },
    { name: "2024-25 Sem 1", start: "2024-08-01", end: "2024-12-15" },
    { name: "2024-25 Sem 2", start: "2025-01-10", end: "2025-05-15" },
    { name: "2025-26 Sem 1", start: "2025-08-01", end: "2025-12-15" },
    { name: "2025-26 Sem 2", start: "2026-01-05", end: "2026-05-15" },
  ];

  await prisma.academicTerm.createMany({
    data: terms.map((t, i) => ({
      name: t.name,
      periodType: PeriodType.SEMESTER,
      startsOn: new Date(t.start),
      endsOn: new Date(t.end),
      isActive: i === terms.length - 1,
    })),
  });
  const rows = await prisma.academicTerm.findMany();
  const active = rows.find((r) => r.isActive)!;
  return { activeTermId: active.id, terms: rows };
}

async function seedEvents(
  secretary: { id: string },
  students: Awaited<ReturnType<typeof prisma.student.findMany>>,
  scanners: { id: string }[],
): Promise<void> {
  const base = new Date("2026-01-08T09:00:00Z");
  const events: {
    title: string;
    description: string;
    startsAt: Date;
    endsAt: Date;
    location: string;
    requiresAttendance: boolean;
    createdById: string;
  }[] = EVENTS.map((ev, i) => ({
    title: ev.title,
    description: `Official ${ev.title.toLowerCase()} organized by the student government.`,
    startsAt: new Date(base.getTime() + i * 4 * 24 * 60 * 60 * 1000),
    endsAt: new Date(base.getTime() + i * 4 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    location: ev.location,
    requiresAttendance: ev.requiresAttendance,
    createdById: secretary.id,
  }));
  await prisma.event.createMany({ data: events });
  const eventRows = await prisma.event.findMany({ orderBy: { startsAt: "asc" } });

  // Attendance: problem students (indices 0-11) plus a rotating crowd
  const attendanceData: {
    eventId: string;
    studentId: string;
    status: AttendanceStatus;
    scannedById: string;
    scannedAt: Date;
  }[] = [];
  const problemStudents = students.slice(0, 12);

  eventRows.forEach((ev, i) => {
    const byStudent = new Map<string, AttendanceStatus>();

    problemStudents.forEach((s, p) => {
      const status = (i + p) % 3 === 0 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT;
      byStudent.set(s.id, status);
    });

    for (let k = 0; k < 12; k++) {
      const s = students[(i * 13 + k * 5) % students.length];
      if (byStudent.has(s.id)) continue;
      let status: AttendanceStatus = AttendanceStatus.PRESENT;
      if ((i + k) % 13 === 0) status = AttendanceStatus.ABSENT;
      else if ((i + k) % 7 === 0) status = AttendanceStatus.LATE;
      else if ((i + k) % 11 === 0) status = AttendanceStatus.EXCUSED;
      byStudent.set(s.id, status);
    }

    const scanner = scanners[i % scanners.length];
    const scannedAt = new Date(ev.startsAt.getTime() + 30 * 60 * 1000);
    for (const [studentId, status] of byStudent) {
      attendanceData.push({ eventId: ev.id, studentId, status, scannedById: scanner.id, scannedAt });
    }
  });

  await prisma.attendance.createMany({ data: attendanceData });
  console.log(`Events: ${eventRows.length}, Attendance: ${attendanceData.length}`);
}

async function seedSanctions(
  activeTermId: string,
  disciplineOfficer: { id: string },
  students: Awaited<ReturnType<typeof prisma.student.findMany>>,
  programs: Awaited<ReturnType<typeof prisma.program.findMany>>,
  yearLevels: Awaited<ReturnType<typeof prisma.yearLevel.findMany>>,
  sections: Awaited<ReturnType<typeof prisma.section.findMany>>,
): Promise<void> {
  const byCode = new Map(programs.map((p) => [p.code, p]));
  const polSci2 = yearLevels.find((y) => y.level === 2 && y.programId === byCode.get("AB-POLSCI")!.id)!;
  const psych3 = yearLevels.find((y) => y.level === 3 && y.programId === byCode.get("BSPSYCH")!.id)!;
  const devcom1a = sections.find((s) => s.name === "A" && s.programYearId === yearLevels.find((y) => y.level === 1 && y.programId === byCode.get("BS-DEVCOM")!.id)!.id)!;
  const psych1b = sections.find((s) => s.name === "B" && s.programYearId === yearLevels.find((y) => y.level === 1 && y.programId === byCode.get("BSPSYCH")!.id)!.id)!;

  const ruleSpecs = [
    { scopeType: ScopeType.FACULTY, threshold: 3, period: PeriodType.SEMESTER },
    { scopeType: ScopeType.FACULTY, threshold: 5, period: PeriodType.SEMESTER },
    { scopeType: ScopeType.FACULTY, threshold: 7, period: PeriodType.SEMESTER },
    { scopeType: ScopeType.FACULTY, threshold: 2, period: PeriodType.EVENT_SERIES },
    { scopeType: ScopeType.PROGRAM, programId: byCode.get("AB-POLSCI")!.id, threshold: 4, period: PeriodType.SEMESTER },
    { scopeType: ScopeType.PROGRAM, programId: byCode.get("BSPSYCH")!.id, threshold: 4, period: PeriodType.SEMESTER },
    { scopeType: ScopeType.PROGRAM_YEAR, programYearId: polSci2.id, threshold: 3, period: PeriodType.SEMESTER },
    { scopeType: ScopeType.PROGRAM_YEAR, programYearId: psych3.id, threshold: 3, period: PeriodType.SEMESTER },
    { scopeType: ScopeType.SECTION, sectionId: devcom1a.id, threshold: 2, period: PeriodType.SEMESTER },
    { scopeType: ScopeType.SECTION, sectionId: psych1b.id, threshold: 2, period: PeriodType.SEMESTER },
  ];

  await prisma.sanctionRule.createMany({
    data: ruleSpecs.map((r) => ({
      scopeType: r.scopeType,
      programId: "programId" in r ? r.programId : undefined,
      programYearId: "programYearId" in r ? r.programYearId : undefined,
      sectionId: "sectionId" in r ? r.sectionId : undefined,
      absenceThreshold: r.threshold,
      period: r.period,
      action: "FLAG_FOR_REVIEW",
      active: true,
    })),
  });
  const rules = await prisma.sanctionRule.findMany();
  const ruleByThreshold = new Map(rules.map((r) => [r.absenceThreshold, r]));
  const rule3 = ruleByThreshold.get(3)!;

  // Absence counts per student
  const absences = await prisma.attendance.groupBy({
    by: ["studentId"],
    where: { status: AttendanceStatus.ABSENT },
    _count: true,
  });
  const absentCount = new Map(absences.map((a) => [a.studentId, a._count]));

  // Flags
  const flags = [];
  let flagIdx = 0;
  for (const s of students.slice(0, 12)) {
    const count = absentCount.get(s.id) ?? 0;
    if (count < 2) continue;
    const status = flagIdx % 5 === 0 ? FlagStatus.DISMISSED : flagIdx % 5 === 1 ? FlagStatus.RESOLVED : FlagStatus.PENDING;
    const reviewed = status === FlagStatus.PENDING ? null : disciplineOfficer.id;
    flags.push({
      studentId: s.id,
      ruleId: rule3.id,
      periodRef: activeTermId,
      triggerCount: count,
      status,
      reviewedById: reviewed,
      reviewedAt: reviewed ? new Date("2026-01-11T12:00:00Z") : null,
    });
    flagIdx++;
  }
  await prisma.sanctionFlag.createMany({ data: flags });

  // Sanctions (10) + evidence from ABSENT attendance rows
  const sanctionStudents = students.slice(0, 10);
  const sanctions = sanctionStudents.map((s, i) => ({
    studentId: s.id,
    ruleId: rule3.id,
    title: "Excessive Absences — Attendance Policy",
    reason: `Reached ${absentCount.get(s.id) ?? 0} unexcused absences under the faculty-wide attendance policy.`,
    status: i % 2 === 0 ? SanctionStatus.OPEN : SanctionStatus.RESOLVED,
    issuedById: disciplineOfficer.id,
    issuedAt: new Date("2026-01-10T08:00:00Z"),
    resolvedById: i % 2 === 0 ? null : disciplineOfficer.id,
    resolvedAt: i % 2 === 0 ? null : new Date("2026-01-12T09:00:00Z"),
    resolvedNote: i % 2 === 0 ? null : "Student completed the required counseling session.",
  }));
  await prisma.sanction.createMany({ data: sanctions });
  const sanctionRows = await prisma.sanction.findMany();

  const evidences = [];
  for (const sanction of sanctionRows) {
    const rows = await prisma.attendance.findMany({
      where: { studentId: sanction.studentId, status: AttendanceStatus.ABSENT },
      take: 2,
    });
    for (const row of rows) {
      evidences.push({ sanctionId: sanction.id, attendanceId: row.id });
    }
  }
  await prisma.sanctionEvidence.createMany({ data: evidences });

  console.log(`Sanction rules: ${rules.length}, flags: ${flags.length}, sanctions: ${sanctionRows.length}, evidences: ${evidences.length}`);
}

async function seedFees(
  treasurer: { id: string },
  students: Awaited<ReturnType<typeof prisma.student.findMany>>,
): Promise<void> {
  const feeRows = FEES.map((f) => ({
    title: f.title,
    amount: f.amount,
    dueDate: new Date(f.due),
    createdById: treasurer.id,
  }));
  await prisma.fee.createMany({ data: feeRows });
  const fees = await prisma.fee.findMany({ orderBy: { dueDate: "asc" } });

  const specs = [
    { feeIdx: 0, studentIdx: 0, status: PaymentStatus.PENDING },
    { feeIdx: 0, studentIdx: 1, status: PaymentStatus.PAID },
    { feeIdx: 1, studentIdx: 2, status: PaymentStatus.PENDING },
    { feeIdx: 1, studentIdx: 3, status: PaymentStatus.PAID },
    { feeIdx: 1, studentIdx: 4, status: PaymentStatus.REJECTED, reason: "Image unreadable — please re-upload a clear photo." },
    { feeIdx: 2, studentIdx: 5, status: PaymentStatus.PENDING },
    { feeIdx: 2, studentIdx: 6, status: PaymentStatus.PAID },
    { feeIdx: 3, studentIdx: 7, status: PaymentStatus.PENDING },
    { feeIdx: 4, studentIdx: 8, status: PaymentStatus.PENDING },
    { feeIdx: 5, studentIdx: 9, status: PaymentStatus.REJECTED, reason: "Proof does not match fee amount." },
    { feeIdx: 6, studentIdx: 10, status: PaymentStatus.PAID },
    { feeIdx: 7, studentIdx: 11, status: PaymentStatus.PENDING },
    { feeIdx: 8, studentIdx: 12, status: PaymentStatus.PAID },
    { feeIdx: 9, studentIdx: 13, status: PaymentStatus.PENDING },
  ];

  const proofs = specs.map((s) => ({
    feeId: fees[s.feeIdx].id,
    studentId: students[s.studentIdx].id,
    fileUrl: `/uploads/proofs/${students[s.studentIdx].studentNo}-receipt.jpg`,
    status: s.status,
    rejectionReason: "reason" in s ? s.reason : undefined,
    verifiedById: s.status === PaymentStatus.PENDING ? null : treasurer.id,
    verifiedAt: s.status === PaymentStatus.PENDING ? null : new Date("2026-01-11T15:00:00Z"),
  }));
  await prisma.feeProof.createMany({ data: proofs });

  console.log(`Fees: ${fees.length}, proofs: ${proofs.length}`);
}

async function seedContentAndAudit(
  superAdmin: { id: string },
  secretary: { id: string },
  treasurer: { id: string },
  pioUser: { id: string },
): Promise<void> {
  // Transparency files
  await prisma.transparencyFile.createMany({
    data: TRANSPARENCY_FILES.map((f, i) => ({
      title: f.title,
      fileUrl: `/uploads/transparency/${f.category}/${i + 1}.pdf`,
      category: f.category,
      uploadedById: f.category === "financial" ? treasurer.id : secretary.id,
      uploadedAt: new Date(2025, 10 + (i % 3), (i % 28) + 1),
    })),
  });

  // Announcements
  await prisma.announcement.createMany({
    data: ANNOUNCEMENTS.map((a, i) => ({
      title: a.title,
      body: a.body,
      createdById: i % 3 === 0 ? pioUser.id : i % 3 === 1 ? superAdmin.id : secretary.id,
      createdAt: new Date(2025, 9 + Math.floor(i / 4), ((i * 3) % 28) + 1),
    })),
  });

  const userRows = await prisma.user.findMany({ orderBy: { email: "asc" } });
  const byEmail = new Map(userRows.map((u) => [u.email, u]));
  const secretaryUser = byEmail.get("secretary@fhusocom.edu")!;
  const treasurerUser = byEmail.get("treasurer@fhusocom.edu")!;
  const pio = byEmail.get("pio@fhusocom.edu")!;
  const disc = byEmail.get("discipline.officer@fhusocom.edu")!;
  const karla = byEmail.get("student1@fhusocom.edu")!;

  const logs: Prisma.AuditLogCreateManyInput[] = [
    { actorId: superAdmin.id, action: AuditAction.ROLE_ASSIGNED, targetId: secretaryUser.id, details: { role: "Secretary", scopeType: "FACULTY" }, timestamp: new Date("2026-01-12T08:41:00Z") },
    { actorId: superAdmin.id, action: AuditAction.ROLE_ASSIGNED, targetId: treasurerUser.id, details: { role: "Treasurer", scopeType: "FACULTY" }, timestamp: new Date("2026-01-12T08:35:00Z") },
    { actorId: superAdmin.id, action: AuditAction.ROLE_REQUEST_REJECTED, targetId: karla.id, details: { role: "Year/Program Rep", scopeType: "PROGRAM_YEAR" }, timestamp: new Date("2026-01-12T08:20:00Z") },
    { actorId: treasurerUser.id, action: AuditAction.PAYMENT_VERIFIED, details: { fee: "Semester Fee", amount: 1850 }, timestamp: new Date("2026-01-11T15:02:00Z") },
    { actorId: disc.id, action: AuditAction.SANCTION_CREATED, details: { title: "Excessive Absences" }, timestamp: new Date("2026-01-11T14:47:00Z") },
    { actorId: superAdmin.id, action: AuditAction.SCOPE_CHANGED, targetId: pio.id, details: { scopeType: "FACULTY" }, timestamp: new Date("2026-01-10T17:29:00Z") },
    { actorId: disc.id, action: AuditAction.FLAG_AUTO_DISMISSED, details: { rule: "3-absence rule", reason: "attendance edited" }, timestamp: new Date("2026-01-10T10:12:00Z") },
    { actorId: disc.id, action: AuditAction.SANCTION_RESOLVED, details: { title: "Excessive Absences" }, timestamp: new Date("2026-01-09T09:30:00Z") },
    { actorId: treasurerUser.id, action: AuditAction.PAYMENT_REJECTED, details: { fee: "Intramurals Fee", reason: "amount mismatch" }, timestamp: new Date("2026-01-09T09:00:00Z") },
    { actorId: superAdmin.id, action: AuditAction.ROLE_REVOKED, targetId: karla.id, details: { role: "Year/Program Rep" }, timestamp: new Date("2026-01-08T16:10:00Z") },
    { actorId: disc.id, action: AuditAction.FLAG_DISMISSED, details: { rule: "5-absence rule" }, timestamp: new Date("2026-01-08T11:05:00Z") },
    { actorId: superAdmin.id, action: AuditAction.ROLE_ASSIGNED, targetId: pio.id, details: { role: "PIO", scopeType: "FACULTY" }, timestamp: new Date("2026-01-07T10:00:00Z") },
    { actorId: treasurerUser.id, action: AuditAction.PAYMENT_VERIFIED, details: { fee: "Membership Fee", amount: 100 }, timestamp: new Date("2026-01-06T13:22:00Z") },
    { actorId: disc.id, action: AuditAction.SANCTION_CREATED, details: { title: "Excessive Absences" }, timestamp: new Date("2026-01-05T09:45:00Z") },
    { actorId: superAdmin.id, action: AuditAction.SCOPE_CHANGED, targetId: treasurerUser.id, details: { scopeType: "FACULTY" }, timestamp: new Date("2026-01-04T15:30:00Z") },
  ];
  await prisma.auditLog.createMany({ data: logs });

  const transparencyCount = await prisma.transparencyFile.count();
  const announcementCount = await prisma.announcement.count();
  console.log(`Transparency files: ${transparencyCount}, announcements: ${announcementCount}, audit logs: ${logs.length}`);
}

async function main(): Promise<void> {
  await wipeMockData();
  await seedPermissions();
  await seedRoles();
  const superAdmin = await seedSuperAdmin();

  const { sections, yearLevels, programs, students } = await seedScopeStructure();
  const { secretary, treasurer, disciplineOfficer, scanners } = await seedUsers(
    superAdmin,
    students,
    yearLevels,
    sections,
  );
  await seedRoleRequests(superAdmin, students, yearLevels, sections);
  const { activeTermId } = await seedAcademicTerms();
  await seedEvents(secretary, students, scanners);
  await seedSanctions(activeTermId, disciplineOfficer, students, programs, yearLevels, sections);
  await seedFees(treasurer, students);

  const pio = await prisma.user.findUniqueOrThrow({ where: { email: "pio@fhusocom.edu" } });
  await seedContentAndAudit(superAdmin, secretary, treasurer, pio);

  // Final summary
  const counts: [string, number][] = [];
  for (const model of [
    "program", "yearLevel", "section", "student", "user", "role", "permission",
    "rolePermission", "userRole", "roleRequest", "academicTerm", "event", "attendance",
    "sanctionRule", "sanction", "sanctionEvidence", "sanctionFlag", "fee", "feeProof",
    "transparencyFile", "announcement", "auditLog",
  ] as const) {
    const delegate = prisma[model as keyof typeof prisma] as { count(): Promise<number> };
    counts.push([model, await delegate.count()]);
  }
  console.log("\n=== Seed summary ===");
  for (const [model, count] of counts) {
    console.log(`${model.padEnd(20)} ${count}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
