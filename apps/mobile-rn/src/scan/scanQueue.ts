import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScanMode } from './models';

export interface QueuedScan {
  id: string;
  eventId: string;
  eventTitle: string;
  scanPassword: string;
  qrText: string;
  studentName: string;
  studentNo?: string | null;
  section?: string | null;
  mode: ScanMode;
  scannedAt: string;
}

const KEY = 'scan_queue_v1';

function toQueued(json: any): QueuedScan {
  return {
    id: json.id as string,
    eventId: json.eventId as string,
    eventTitle: json.eventTitle as string,
    scanPassword: json.scanPassword as string,
    qrText: json.qrText as string,
    studentName: json.studentName as string,
    studentNo: (json.studentNo as string) ?? null,
    section: (json.section as string) ?? null,
    mode: ((json.mode as ScanMode) ?? 'checkin') as ScanMode,
    scannedAt: json.scannedAt as string,
  };
}

export async function loadQueue(): Promise<QueuedScan[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw || raw.length === 0) return [];
    const list = JSON.parse(raw) as any[];
    return list.map(toQueued);
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedScan[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(queue));
}

export async function addScan(scan: QueuedScan): Promise<void> {
  const queue = await loadQueue();
  queue.push(scan);
  await saveQueue(queue);
}

export async function removeScansByIds(ids: string[]): Promise<void> {
  const idSet = new Set(ids);
  const queue = await loadQueue();
  const next = queue.filter((e) => !idSet.has(e.id));
  await saveQueue(next);
}

export async function clearQueue(): Promise<void> {
  await saveQueue([]);
}