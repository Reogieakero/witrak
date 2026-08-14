"use client";

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  authorName: string;
  authorRole?: string;
  createdAt: string;
  imageUrl?: string | null;
  audience?: string;
  scopeType?: string;
  programId?: string | null;
}

export interface ProgramOption {
  id: string;
  name: string;
  code: string;
}

export interface AnnouncementStats {
  total: number;
  thisWeek: number;
  authors: number;
  termName: string;
}

export interface AnnouncementsViewProps {
  announcements: AnnouncementItem[];
  stats: AnnouncementStats;
  programs: ProgramOption[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  userName?: string;
  roleLabel?: string;
}

export interface AnnouncementsStatsGridProps {
  stats: AnnouncementStats;
}

export interface AnnouncementsFeedProps {
  announcements: AnnouncementItem[];
  query: string;
  page: number;
  onQuery: (q: string) => void;
  onPageChange: (page: number) => void;
  onView: (announcementId: string) => void;
}

export type FormHandler = (formData: FormData) => void;

export type AnnouncementModal = { kind: "create" } | { kind: "edit"; id: string };
export type AnnouncementDrawer = { kind: "view"; id: string };

export interface AnnouncementsModalsProps {
  announcements: AnnouncementItem[];
  programs: ProgramOption[];
  modal: AnnouncementModal | null;
  drawer: AnnouncementDrawer | null;
  busy: boolean;
  onCloseModal: () => void;
  onCloseDrawer: () => void;
  onCreate: FormHandler;
  onUpdate: FormHandler;
  onEdit: (announcementId: string) => void;
  onDelete: (announcementId: string) => void;
}
