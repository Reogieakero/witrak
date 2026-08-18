import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { api, ApiException } from '../core/apiClient';
import { alpha, FhusoColors, FhusoFonts, ThemeMode } from '../core/theme';
import {
  isStudentQrValid,
  parseStudentQr,
  ScanEvent,
  ScanLogEntry,
  ScanMode,
  ScanResult,
} from './models';
import {
  addScan,
  loadQueue,
  markScansSynced,
  QueuedScan,
} from './scanQueue';

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0].length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatTime(d: Date): string {
  const ph = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return `${pad2(ph.getUTCHours())}:${pad2(ph.getUTCMinutes())}`;
}

interface ScannerScreenProps {
  event: ScanEvent;
  passcode: string;
  onClose: () => void;
}

export function ScannerScreen({ event, passcode, onClose }: ScannerScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanLogEntry[]>([]);
  const [pending, setPending] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [mode, setMode] = useState<ScanMode>('checkin');
  const autoReset = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultRef = useRef<ScanResult | null>(null);
  const historyRef = useRef<ScanLogEntry[]>([]);

  useEffect(() => {
    loadHistory();
    return () => {
      if (autoReset.current) clearTimeout(autoReset.current);
    };
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (historyOpen) {
        setHistoryOpen(false);
        return true;
      }
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [historyOpen, onClose]);

  function setResultSafe(r: ScanResult | null) {
    resultRef.current = r;
    setResult(r);
  }

  function setHistorySafe(h: ScanLogEntry[]) {
    historyRef.current = h;
    setHistory(h);
  }

  async function loadHistory() {
    const queue = await loadQueue();
    const entries = queue
      .map(
        (s): ScanLogEntry => ({
          id: s.id,
          studentName: s.studentName,
          studentNo: s.studentNo,
          section: s.section,
          scannedAt: new Date(s.scannedAt),
          synced: s.synced === true,
          duplicate: s.duplicate === true,
        }),
      )
      .sort((a, b) => b.scannedAt.getTime() - a.scannedAt.getTime());
    setPending(queue.filter((s) => !s.synced && !s.duplicate).length);
    setHistorySafe(entries);
  }

  const readyCount = history.filter((e) => !e.synced && !e.duplicate).length;

  function scheduleAutoReset() {
    if (autoReset.current) clearTimeout(autoReset.current);
    autoReset.current = setTimeout(() => {
      setResultSafe(null);
    }, 2200);
  }

  async function onBarcodeScanned(scanningResult: BarcodeScanningResult) {
    if (processing || resultRef.current != null) return;
    const qrText = scanningResult.data;
    if (qrText == null || qrText.length === 0) return;

    setProcessing(true);

    const qr = parseStudentQr(qrText);
    if (!isStudentQrValid(qr)) {
      setResultSafe({
        ok: false,
        message: 'Could not read the student ID from the QR code.',
        alreadyScanned: false,
        fromLocal: true,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setProcessing(false);
      scheduleAutoReset();
      return;
    }

    const queue = await loadQueue();
    const duplicate = queue.some(
      (s) =>
        s.eventId === event.id &&
        s.studentNo === qr.studentNo &&
        s.mode === mode,
    );

    if (duplicate) {
      const dupId = String(Date.now());
      const dupTime = new Date();
      await addScan({
        id: dupId,
        eventId: event.id,
        eventTitle: event.title,
        scanPassword: passcode,
        qrText,
        studentName: qr.name,
        studentNo: qr.studentNo,
        section: qr.section,
        mode,
        scannedAt: dupTime.toISOString(),
        duplicate: true,
        synced: true,
      });
      setHistorySafe([
        {
          id: dupId,
          studentName: qr.name,
          studentNo: qr.studentNo,
          section: qr.section,
          scannedAt: dupTime,
          synced: true,
          duplicate: true,
        },
        ...historyRef.current,
      ]);
      setResultSafe({
        ok: true,
        alreadyScanned: true,
        message:
          mode === 'checkin'
            ? 'Already checked in.'
            : 'Already checked out.',
        studentName: qr.name,
        studentNo: qr.studentNo,
        section: qr.section,
        fromLocal: true,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      setProcessing(false);
      scheduleAutoReset();
      return;
    }

    const scanId = String(Date.now());
    const now = new Date();
    const scan: QueuedScan = {
      id: scanId,
      eventId: event.id,
      eventTitle: event.title,
      scanPassword: passcode,
      qrText,
      studentName: qr.name,
      studentNo: qr.studentNo,
      section: qr.section,
      mode,
      scannedAt: now.toISOString(),
    };
    await addScan(scan);

    setPending((p) => p + 1);
    setHistorySafe([
      {
        id: scanId,
        studentName: qr.name,
        studentNo: qr.studentNo,
        section: qr.section,
        scannedAt: now,
        synced: false,
        duplicate: false,
      },
      ...historyRef.current,
    ]);
    setResultSafe({
      ok: true,
      message: 'Saved on this device. Tap Sync to upload.',
      alreadyScanned: false,
      studentName: qr.name,
      studentNo: qr.studentNo,
      section: qr.section,
      fromLocal: true,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    setProcessing(false);
    scheduleAutoReset();
  }

  async function sync() {
    if (syncing) return;
    setSyncing(true);
    const queue = await loadQueue();
    const toSync = queue.filter((s) => !s.synced && !s.duplicate);
    if (toSync.length === 0) {
      setSyncing(false);
      alert('Nothing to sync.');
      return;
    }

    const syncedIds: string[] = [];
    let firstError: string | null = null;
    for (const scan of toSync) {
      try {
        await api.post('/api/mobile/scan', {
          eventId: scan.eventId,
          scanPassword: scan.scanPassword,
          qrText: scan.qrText,
          mode: scan.mode,
        });
        syncedIds.push(scan.id);
      } catch (e) {
        if (firstError == null) {
          firstError =
            e instanceof ApiException
              ? e.message
              : 'Could not sync. Check your connection and try again.';
        }
      }
    }

    await markScansSynced(syncedIds);
    const idSet = new Set(syncedIds);
    const remaining = toSync.length - syncedIds.length;
    setPending(remaining);
    setHistorySafe(
      historyRef.current.map((e) =>
        idSet.has(e.id) ? { ...e, synced: true } : e,
      ),
    );
    setSyncing(false);
    alert(
      syncedIds.length === 0
        ? firstError ?? 'Could not sync. Check your connection and try again.'
        : remaining === 0
          ? `Synced ${syncedIds.length} scan${syncedIds.length === 1 ? '' : 's'}.`
          : `Synced ${syncedIds.length}. ${remaining} could not sync${
              firstError ? `: ${firstError}` : '.'
            }`,
    );
  }

  if (!permission) {
    return (
      <View style={styles.scannerRoot}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.scannerRoot}>
        <View style={styles.permBox}>
          <Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.5)" />
          <Text style={styles.permText}>
            We need camera permission to scan member QR codes.
          </Text>
          <Pressable style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnLabel}>Grant permission</Text>
          </Pressable>
          <Pressable style={styles.permCancel} onPress={onClose}>
            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.scannerRoot}>
      {scannerError != null ? (
        <View style={styles.permBox}>
          <Ionicons name="alert-circle" size={48} color="rgba(255,255,255,0.5)" />
          <Text style={styles.permText}>{scannerError}</Text>
          <Pressable style={styles.permCancel} onPress={onClose}>
            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torchOn}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onBarcodeScanned}
          onMountError={(e) => setScannerError(e.message)}
        />
      )}

      <View style={styles.bgLogoWrap} pointerEvents="none">
        <Image
          source={require('../../assets/logo.png')}
          style={styles.bgLogo}
          resizeMode="contain"
        />
      </View>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topRow}>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={styles.closeBtn}
            accessibilityLabel="Close scanner"
          >
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
          <View style={styles.topBar} pointerEvents="none">
            <Text style={styles.topTitle}>{event.title}</Text>
            <Text style={styles.topSubtitle}>Point at a member's QR code</Text>
          </View>
        </View>

        {event.hasTimeInOut && (
          <View style={styles.modeToggle}>
            <Pressable
              onPress={() => {
                setMode('checkin');
                setResultSafe(null);
              }}
              style={[styles.modeBtn, mode === 'checkin' && styles.modeBtnActive]}
            >
              <Text
                style={[
                  styles.modeLabel,
                  mode === 'checkin' && styles.modeLabelActive,
                ]}
              >
                Time In
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMode('checkout');
                setResultSafe(null);
              }}
              style={[styles.modeBtn, mode === 'checkout' && styles.modeBtnActive]}
            >
              <Text
                style={[
                  styles.modeLabel,
                  mode === 'checkout' && styles.modeLabelActive,
                ]}
              >
                Time Out
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.scanFrame} pointerEvents="none" />
        <Text style={styles.scanHint} pointerEvents="none">
          Keep the QR code inside the square
        </Text>

        <View style={styles.flexSpacer} />

        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator color="#fff" />
          </View>
        )}

        {pending > 0 && (
          <View style={styles.offlineBadge} pointerEvents="none">
            <Ionicons name="wifi-outline" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.offlineBadgeText}>
              {pending === 0
                ? 'Offline mode'
                : `Offline · ${pending} queued`}
            </Text>
          </View>
        )}

        {result != null && (
          <ResultPanel
            result={result}
            mode={mode}
            themeMode="dark"
            onDismiss={() => setResultSafe(null)}
          />
        )}

        <View style={styles.bottomBar} pointerEvents="box-none">
          <Pressable
            onPress={() => setTorchOn((t) => !t)}
            style={[
              styles.torchBtn,
              { backgroundColor: torchOn ? FhusoColors.brand : '#fff' },
            ]}
          >
            <Ionicons
              name={torchOn ? 'flash' : 'flash-outline'}
              size={20}
              color={torchOn ? '#fff' : FhusoColors.inkLight}
            />
          </Pressable>

          <View style={styles.actionGroup}>
            <Pressable
              onPress={() => setHistoryOpen(true)}
              style={[styles.actionBtn, styles.historyBtn]}
            >
              {readyCount > 0 && (
                <View style={styles.badgeDot}>
                  <Text style={styles.badgeDotText}>{readyCount}</Text>
                </View>
              )}
              <Ionicons name="time-outline" size={16} color="#fff" />
              <Text style={styles.actionLabel}>History</Text>
            </Pressable>

            <Pressable
              onPress={sync}
              disabled={syncing}
              style={[styles.actionBtn, styles.syncBtn]}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                  <Text style={styles.actionLabel}>
                    {pending > 0 ? `Sync (${pending})` : 'Sync'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <Modal visible={historyOpen} animationType="slide" onRequestClose={() => setHistoryOpen(false)}>
        <HistoryPanel
          history={history}
          syncing={syncing}
          onClose={() => setHistoryOpen(false)}
          onSync={sync}
        />
      </Modal>
    </View>
  );
}

function ResultPanel({
  result,
  mode,
  onDismiss,
}: {
  result: ScanResult;
  mode: ScanMode;
  themeMode: ThemeMode;
  onDismiss: () => void;
}) {
  const ok = result.ok;
  const color = ok
    ? result.alreadyScanned
      ? FhusoColors.brand
      : FhusoColors.success
    : FhusoColors.danger;

  return (
    <Pressable style={styles.resultWrap} onPress={onDismiss}>
      <View style={styles.resultCard}>
        <View style={styles.resultLogoWrap}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.resultLogo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.resultBody}>
          <Text style={[styles.resultTitle, { color }]}>
            {ok
              ? result.alreadyScanned
                ? mode === 'checkin'
                  ? 'Already checked in'
                  : 'Already checked out'
                : 'Saved'
              : mode === 'checkin'
                ? 'Check-in failed'
                : 'Check-out failed'}
          </Text>
          {result.message.length > 0 && (
            <Text style={styles.resultMessage}>{result.message}</Text>
          )}
          {result.studentName != null && (
            <View style={styles.resultDetails}>
              <Row icon="person-outline" text={result.studentName} />
              {result.studentNo != null && (
                <Row icon="card-outline" text={result.studentNo} />
              )}
              {result.section != null && (
                <Row icon="people-outline" text={result.section} />
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function Row({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={FhusoColors.mutedDark} />
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

function HistoryPanel({
  history,
  syncing,
  onClose,
  onSync,
}: {
  history: ScanLogEntry[];
  syncing: boolean;
  onClose: () => void;
  onSync: () => void;
}) {
  const [tab, setTab] = useState(0);
  const ready = history.filter((e) => !e.synced && !e.duplicate);
  const synced = history.filter((e) => e.synced && !e.duplicate);
  const duplicates = history.filter((e) => e.duplicate);
  const tabs = ['Ready to sync', 'Synced', 'Already checked in'];
  const items = [ready, synced, duplicates];

  return (
    <View style={[styles.historyRoot, { backgroundColor: FhusoColors.surfaceDark }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Scan history</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={FhusoColors.mutedDark} />
          </Pressable>
        </View>

        <View style={styles.historyStats}>
          <StatusChip label={`${ready.length} ready`} color={FhusoColors.warning} />
          <StatusChip label={`${synced.length} synced`} color={FhusoColors.success} />
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={onSync}
            disabled={syncing}
            style={styles.historySyncBtn}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.historySyncLabel}>
                {ready.length > 0 ? `Sync (${ready.length})` : 'Sync'}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.historyTabs}>
          {tabs.map((t, i) => (
            <Pressable
              key={t}
              onPress={() => setTab(i)}
              style={[styles.historyTab, tab === i && styles.historyTabActive]}
            >
              <Text
                style={[
                  styles.historyTabLabel,
                  { color: tab === i ? FhusoColors.brand : FhusoColors.mutedDark },
                ]}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView style={{ flex: 1 }}>
          {items[tab].length === 0 ? (
            <View style={styles.historyEmpty}>
              <Text style={{ color: FhusoColors.mutedDark }}>Nothing here.</Text>
            </View>
          ) : (
            items[tab].map((e, i) => <HistoryEntry key={e.id + i} entry={e} />)
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatusChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: alpha(color, 0.14) }]}>
      <Text style={[styles.chipLabel, { color }]}>{label}</Text>
    </View>
  );
}

function HistoryEntry({ entry }: { entry: ScanLogEntry }) {
  let chipColor: string;
  let chipLabel: string;
  if (entry.synced) {
    chipColor = FhusoColors.success;
    chipLabel = 'Synced';
  } else if (entry.duplicate) {
    chipColor = FhusoColors.brand;
    chipLabel = 'Already checked in';
  } else {
    chipColor = FhusoColors.warning;
    chipLabel = 'Ready to sync';
  }

  return (
    <View style={styles.entry}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initialsOf(entry.studentName)}</Text>
      </View>
      <View style={styles.entryBody}>
        <Text style={styles.entryName}>{entry.studentName}</Text>
        {entry.studentNo != null && (
          <Text style={styles.entrySub}>{entry.studentNo}</Text>
        )}
      </View>
      <View style={styles.entryRight}>
        <StatusChip label={chipLabel} color={chipColor} />
        <Text style={styles.entryTime}>{formatTime(entry.scannedAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scannerRoot: { flex: 1, backgroundColor: '#0B1220' },
  bgLogoWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.16,
  },
  bgLogo: { width: '60%', aspectRatio: 1 },
  overlay: { flex: 1, padding: 16 },
  topRow: { position: 'relative', marginTop: 4 },
  topBar: { alignItems: 'center' },
  topTitle: { color: '#fff', fontSize: 16, fontFamily: FhusoFonts.bold },
  topSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 3,
  },
  modeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 8,
  },
  modeBtnActive: { backgroundColor: FhusoColors.brand },
  modeLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontFamily: FhusoFonts.bold,
  },
  modeLabelActive: { color: '#fff' },
  scanFrame: {
    width: '76%',
    aspectRatio: 1,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: FhusoColors.brand,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  flexSpacer: { flex: 1 },
  scanHint: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontFamily: FhusoFonts.semiBold,
    textAlign: 'center',
    marginBottom: 8,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBadge: {
    position: 'absolute',
    top: 120,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11,18,32,0.8)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  offlineBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: FhusoFonts.semiBold,
    marginLeft: 8,
  },
  resultWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: FhusoColors.surfaceDark,
    borderRadius: 20,
    padding: 20,
  },
  resultLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 14,
  },
  resultLogo: { width: 48, height: 48 },
  resultBody: { flex: 1 },
  resultTitle: { fontSize: 17, fontFamily: FhusoFonts.extraBold },
  resultMessage: { fontSize: 13, color: FhusoColors.mutedDark, marginTop: 2 },
  resultDetails: { marginTop: 14 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rowText: { color: FhusoColors.inkDark, fontSize: 14, marginLeft: 10, flex: 1 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  torchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGroup: { flexDirection: 'row' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    height: 24,
    borderRadius: 10,
    marginLeft: 8,
  },
  historyBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
  },
  syncBtn: { backgroundColor: FhusoColors.brand },
  actionLabel: { color: '#fff', fontSize: 12, fontFamily: FhusoFonts.bold, marginLeft: 6 },
  badgeDot: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: FhusoColors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 2,
  },
  badgeDotText: { color: '#fff', fontSize: 10, fontFamily: FhusoFonts.extraBold },
  permBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  permBtn: {
    marginTop: 16,
    backgroundColor: FhusoColors.brand,
    height: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  permBtnLabel: { color: '#fff', fontSize: 15, fontFamily: FhusoFonts.semiBold },
  permCancel: { marginTop: 16, padding: 8 },
  historyRoot: { flex: 1 },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(161,161,170,0.2)',
  },
  historyTitle: { color: FhusoColors.inkDark, fontSize: 18, fontFamily: FhusoFonts.extraBold },
  historyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  historySyncBtn: {
    backgroundColor: FhusoColors.brand,
    height: 24,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  historySyncLabel: { color: '#fff', fontSize: 12, fontFamily: FhusoFonts.bold },
  historyTabs: { flexDirection: 'row', paddingHorizontal: 16 },
  historyTab: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginRight: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  historyTabActive: { borderBottomColor: FhusoColors.brand },
  historyTabLabel: { fontSize: 13, fontFamily: FhusoFonts.semiBold },
  historyEmpty: { alignItems: 'center', paddingTop: 40 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  chipLabel: { fontSize: 10, fontFamily: FhusoFonts.extraBold },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: alpha(FhusoColors.brand, 0.16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: FhusoColors.brand, fontSize: 12, fontFamily: FhusoFonts.bold },
  entryBody: { flex: 1, marginLeft: 12 },
  entryName: { color: FhusoColors.inkDark, fontSize: 14, fontFamily: FhusoFonts.bold },
  entrySub: { color: FhusoColors.mutedDark, fontSize: 12 },
  entryRight: { alignItems: 'flex-end' },
  entryTime: { color: FhusoColors.mutedDark, fontSize: 11, marginTop: 4 },
});