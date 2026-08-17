export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";

export type AttendanceEventItem = {
  id: string;
  title: string;
  location: string | null;
  programId: string | null;
  month: string;
  day: number;
  scheduleDate: string;
  scheduleTime: string;
  status: "live" | "upcoming" | "past";
  present: number;
  late: number;
  absent: number;
  total: number;
  rate: number;
  canScan: boolean;
};

export type AttendanceStudentItem = {
  id: string;
  name: string;
  sectionName: string;
  studentNo: string;
  programId: string | null;
  programCode: string;
  yearLevel: number;
  present: number;
  late: number;
  absent: number;
  total: number;
  rate: number;
};

export type AttendanceStats = {
  totalRecords: number;
  presentRate: number;
  scannedToday: number;
  liveEventTitle: string | null;
  expected: number;
  attended: number;
  absences: number;
  termName: string;
  eventCount: number;
  presentTotal: number;
};

export type AttendanceRecord = {
  id: string;
  eventId: string;
  studentId: string;
  status: AttendanceStatus;
  scannedAt: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  eventTitle: string;
  scheduleDate: string;
  studentName: string;
  sectionName: string;
};

export type AttendanceAccess = {
  scan: boolean;
  edit: boolean;
  view: boolean;
};
