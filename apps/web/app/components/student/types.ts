export type StudentSectionLabel = {
  name: string | null;
  programYear: {
    level: number;
    program: { code: string };
  } | null;
} | null;

export type StudentAttendanceItem = {
  id: string;
  eventTitle: string;
  eventStatus: "live" | "upcoming" | "completed";
  startsAt: string;
  location: string | null;
  requiresAttendance: boolean;
  attendanceStatus:
    | "PRESENT"
    | "LATE"
    | "EXCUSED"
    | "ABSENT"
    | "NOT_SCANNED"
    | "NOT_YET"
    | "NOT_RECORDED"
    | "CHECKED_OUT_ONLY";
  scannedAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
};

export type StudentEventItem = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string;
  day: number;
  month: string;
  scheduleTime: string;
  requiresAttendance: boolean;
  isLive: boolean;
};

export type StudentFeeItem = {
  id: string;
  title: string;
  amount: string;
  amountValue: number;
  dueDate: string;
  status: "PAID" | "PENDING" | "REJECTED" | "UNPAID";
  proofId?: string;
};

export type StudentAnnouncementItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  authorName: string;
};

export type StudentTransparencyItem = {
  id: string;
  title: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  category: string;
  categoryLabel: string;
  categoryTone: "green" | "violet" | "amber" | "brand";
};

export type StudentSanctionItem = {
  id: string;
  title: string;
  reason: string;
  requirement: string | null;
  status: "OPEN" | "RESOLVED";
  issuedAt: string;
};

export type StudentHomeData = {
  studentName: string;
  firstName: string;
  sectionLabel: string;
  termName: string;
  attendanceRate: number;
  absences: number;
  attendedEvents: number;
  totalEvents: number;
  upcomingEvents: number;
  liveEvents: number;
  completedEvents: number;
  totalFees: number;
  totalPaid: number;
  balance: number;
  pendingFees: number;
  openSanctions: number;
  transparencyCount: number;
  announcements: StudentAnnouncementItem[];
  events: StudentEventItem[];
  attendance: StudentAttendanceItem[];
  transparency: StudentTransparencyItem[];
  transparencyAll: StudentTransparencyItem[];
  fees: StudentFeeItem[];
  sanctions: StudentSanctionItem[];
};