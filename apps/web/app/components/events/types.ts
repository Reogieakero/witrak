export type EventStatus = "live" | "upcoming" | "past";

export type EventItem = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  requiresAttendance: boolean;
  scanPassword: string | null;
  programId: string | null;
  programName: string | null;
  createdByName: string;
  startsAt: string;
  endsAt: string;
  month: string;
  day: number;
  scheduleDate: string;
  scheduleTime: string;
  status: EventStatus;
  daysUntil: number | null;
  attendanceTotal: number;
  attendancePresent: number;
  attendanceRate: number | null;
  canEdit: boolean;
  canDelete: boolean;
};

export type EventsStats = {
  total: number;
  upcoming: number;
  live: number;
  past: number;
  avgRate: number;
  presentTotal: number;
  attendanceTotal: number;
  studentCount: number;
  termName: string;
};

export type EventsAccess = {
  create: boolean;
  edit: boolean;
  delete: boolean;
  yearRep: boolean;
};
