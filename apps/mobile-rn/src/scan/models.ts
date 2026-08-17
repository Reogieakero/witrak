export type ScanMode = 'checkin' | 'checkout';

export interface ScanEvent {
  id: string;
  title: string;
  location: string | null;
  status: string;
  startsAt: Date;
  endsAt: Date;
  hasTimeInOut: boolean;
}

export function canScanEvent(event: ScanEvent): boolean {
  return event.status !== 'past';
}

export function scanEventFromJson(json: any): ScanEvent {
  return {
    id: json.id as string,
    title: json.title as string,
    location: (json.location as string) ?? null,
    status: json.status as string,
    startsAt: new Date(json.startsAt as string),
    endsAt: new Date(json.endsAt as string),
    hasTimeInOut: (json.hasTimeInOut as boolean) ?? false,
  };
}

export interface ScanResult {
  ok: boolean;
  message: string;
  alreadyScanned: boolean;
  studentName?: string | null;
  studentNo?: string | null;
  section?: string | null;
  fromLocal: boolean;
}

export function scanResultFromJson(json: any): ScanResult {
  return {
    ok: json.ok as boolean,
    message: (json.message as string) ?? '',
    alreadyScanned: (json.alreadyScanned as boolean) ?? false,
    studentName: (json.student?.name as string) ?? null,
    studentNo: (json.student?.studentNo as string) ?? null,
    section: (json.student?.section as string) ?? null,
    fromLocal: false,
  };
}

export interface ScanLogEntry {
  id: string;
  studentName: string;
  studentNo?: string | null;
  section?: string | null;
  scannedAt: Date;
  synced: boolean;
  duplicate: boolean;
}

export interface StudentQr {
  name: string;
  studentNo: string;
  section?: string | null;
  email?: string | null;
  raw: string;
}

export function parseStudentQr(raw: string): StudentQr {
  const line = (label: string): string => {
    for (const l of raw.split('\n')) {
      const t = l.trim();
      if (t.toLowerCase().startsWith(label.toLowerCase())) {
        const v = t.substring(label.length).trim();
        if (v.length > 0) return v;
      }
    }
    return '';
  };

  return {
    name: line('Name:'),
    studentNo: line('Student No:'),
    section: line('Section:') || null,
    email: line('Email:') || null,
    raw,
  };
}

export function isStudentQrValid(qr: StudentQr): boolean {
  return qr.name.length > 0 && qr.studentNo.length > 0;
}