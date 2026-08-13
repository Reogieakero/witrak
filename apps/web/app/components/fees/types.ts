"use client";

export type FeesListTab = "balances" | "pending" | "verified";

export type FeeProofStatus = "PENDING" | "PAID" | "REJECTED";

export type BalanceStatus = "PAID" | "PENDING" | "REJECTED" | "UNPAID";

export interface FeeItem {
  id: string;
  title: string;
  amount: string;
  amountValue: number;
  dueDate: string;
  dueDateValue: string;
}

export interface FeeProofRow {
  id: string;
  status: FeeProofStatus;
  studentId: string;
  studentName: string;
  studentNo: string;
  sectionName: string;
  yearLevel: number;
  programCode: string;
  feeId: string;
  feeTitle: string;
  feeAmount: string;
  fileUrl: string;
  submittedAt: string;
  verifiedByName?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface StudentBalanceCell {
  feeId: string;
  status: BalanceStatus;
  proofId?: string;
}

export interface StudentBalanceRow {
  id: string;
  studentName: string;
  studentNo: string;
  sectionName: string;
  yearLevel: number;
  programCode: string;
  cells: StudentBalanceCell[];
  balance: string;
  paidInFull: boolean;
}

export interface FeeStats {
  target: string;
  collected: string;
  collectedPct: number;
  pending: number;
  rejected: number;
  termName: string;
  feeCount: number;
  paidCount: number;
}

export interface FeesViewProps {
  fees: FeeItem[];
  proofRows: FeeProofRow[];
  balanceRows: StudentBalanceRow[];
  stats: FeeStats;
  canCreate: boolean;
  canVerify: boolean;
}

export interface FeesTablesProps {
  fees: FeeItem[];
  proofRows: FeeProofRow[];
  balanceRows: StudentBalanceRow[];
  tab: FeesListTab;
  query: string;
  page: number;
  canVerify: boolean;
  onTab: (tab: FeesListTab) => void;
  onQuery: (q: string) => void;
  onPageChange: (page: number) => void;
  onOpenProof: (proofId: string) => void;
  onVerify: (proofId: string) => void;
  disabled?: boolean;
}

export type FormHandler = (formData: FormData) => void;

export type FeesModal =
  | { kind: "fee" }
  | { kind: "edit"; feeId: string }
  | { kind: "verify"; proofId: string };

export type FeesDrawer = { kind: "proof"; proofId: string };

export interface FeesModalsProps {
  fees: FeeItem[];
  proofs: FeeProofRow[];
  modal: FeesModal | null;
  drawer: FeesDrawer | null;
  busy: boolean;
  onCloseModal: () => void;
  onCloseDrawer: () => void;
  onCreateFee: FormHandler;
  onEditFee: FormHandler;
  onVerify: (proofId: string, decision: "approve" | "reject", reason?: string) => void;
}

export interface FeesSidebarProps {
  canCreate: boolean;
  canVerify: boolean;
  pendingProofId?: string;
  onCreateFee: () => void;
  onVerifyQuick: () => void;
  onPaymentDetails: () => void;
  fees: FeeItem[];
  onEditFee: (feeId: string) => void;
  onDeleteFee: (feeId: string) => void;
  stats: FeeStats;
}

export interface FeesStatsGridProps {
  stats: FeeStats;
}