export type CategoryTone = "green" | "violet" | "amber" | "brand";

export type TransparencyFileItem = {
  id: string;
  title: string;
  fileUrl: string;
  fileType?: string;
  category: string;
  categoryLabel: string;
  categoryTone: CategoryTone;
  uploadedBy: string;
  uploadedAt: string;
  size?: string;
  canDelete: boolean;
};

export type TransparencyStats = {
  totalFiles: number;
  termName: string;
  financialCount: number;
  eventsCount: number;
  minutesCount: number;
  reportsCount: number;
};
