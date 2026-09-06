import type { ReportStatus, ReportCategory } from "@prisma/client";

export type ReportStatusType = ReportStatus;

export type ReportCategoryType = ReportCategory;

export type ReportItem = {
  id: string;
  studentId: string;
  studentName: string;
  studentNo: string;
  sectionName: string;
  programCode: string;
  yearLevel: number;
  category: ReportCategoryType;
  subject: string;
  description: string;
  status: ReportStatusType;
  eventId: string | null;
  eventTitle: string | null;
  eventDate: string | null;
  feeId: string | null;
  feeTitle: string | null;
  createdAt: string;
  resolutionNote: string | null;
};

export type ReportStats = {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  termName: string;
};

export type ReportsViewProps = {
  reports: ReportItem[];
  stats: ReportStats;
  canManage: boolean;
};
