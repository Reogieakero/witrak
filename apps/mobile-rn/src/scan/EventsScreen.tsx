import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { api, ApiException } from '../core/apiClient';
import { alpha, FhusoColors, FhusoFonts, ThemeMode } from '../core/theme';
import {
  canScanEvent,
  scanEventFromJson,
  ScanEvent,
} from './models';
import { ScannerScreen } from './ScannerScreen';

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function scheduleLabel(event: ScanEvent): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const time = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return `${months[event.startsAt.getMonth()]} ${event.startsAt.getDate()} · ${time(
    event.startsAt,
  )} – ${time(event.endsAt)}`;
}

function statusColor(status: string, mode: ThemeMode): string {
  switch (status) {
    case 'live':
      return FhusoColors.success;
    case 'upcoming':
      return FhusoColors.brand;
    default:
      return mode === 'dark' ? FhusoColors.mutedDark : FhusoColors.mutedLight;
  }
}

interface EventsScreenProps {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}

export function EventsScreen({ themeMode, onToggleTheme }: EventsScreenProps) {
  const [events, setEvents] = useState<ScanEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeEvent, setActiveEvent] = useState<ScanEvent | null>(null);
  const [scannerSession, setScannerSession] = useState<{
    event: ScanEvent;
    passcode: string;
  } | null>(null);

  const isDark = themeMode === 'dark';
  const colors = {
    canvas: isDark ? FhusoColors.canvasDark : FhusoColors.canvasLight,
    surface: isDark ? FhusoColors.surfaceDark : FhusoColors.surfaceLight,
    border: isDark ? FhusoColors.borderDark : FhusoColors.borderLight,
    ink: isDark ? FhusoColors.inkDark : FhusoColors.inkLight,
    muted: isDark ? FhusoColors.mutedDark : FhusoColors.mutedLight,
  };

  async function load(silent = false) {
    if (!silent) setLoading(true);
    setError(null);
    try {
      console.log(`[events] loading events from base: ${api.baseUrl}`);
      const json = await api.get('/api/mobile/events');
      const list = ((json['events'] as any[]) ?? []).map((e) =>
        scanEventFromJson(e),
      );
      setEvents(list);
    } catch (e) {
      if (e instanceof ApiException) {
        console.log(`[events] ApiException: ${e.statusCode} ${e.message}`);
        setError(e.message);
      } else {
        console.log('[events] unexpected error', e);
        setError('Could not load events. Check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onRefresh() {
    setRefreshing(true);
    load(true);
  }

  const live = (events ?? []).filter((e) => e.status === 'live');
  const upcoming = (events ?? []).filter((e) => e.status === 'upcoming');
  const past = (events ?? []).filter((e) => e.status === 'past');

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.appBar}>
          <Text style={[styles.appBarTitle, { color: colors.ink }]}>
            Liberal Scanner
          </Text>
          <Pressable onPress={onToggleTheme} hitSlop={8}>
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={22}
              color={colors.ink}
            />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={FhusoColors.brand} />
          </View>
        ) : error != null ? (
          <ScrollView contentContainerStyle={styles.center}>
            <Ionicons
              name="cloud-offline-outline"
              size={48}
              color={colors.muted}
            />
            <Text style={[styles.errorText, { color: colors.muted }]}>
              {error}
            </Text>
            <Pressable
              style={[styles.retryBtn, { backgroundColor: FhusoColors.brand }]}
              onPress={() => load()}
            >
              <Text style={styles.retryLabel}>Retry</Text>
            </Pressable>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={FhusoColors.brand}
                colors={[FhusoColors.brand]}
              />
            }
          >
            <SectionHeader icon="flash" title="Live now" count={live.length} colors={colors} />
            {live.length === 0 ? (
              <EmptyCard
                message="No live events right now."
                icon="time-outline"
                colors={colors}
              />
            ) : (
              live.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  emphasize
                  themeMode={themeMode}
                  colors={colors}
                  onPress={() => setActiveEvent(e)}
                />
              ))
            )}

            {upcoming.length > 0 && (
              <>
                <View style={{ height: 24 }} />
                <SectionHeader icon="calendar" title="Upcoming" count={upcoming.length} colors={colors} />
                {upcoming.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    themeMode={themeMode}
                    colors={colors}
                    onPress={() => setActiveEvent(e)}
                  />
                ))}
              </>
            )}

            {past.length > 0 && (
              <>
                <View style={{ height: 24 }} />
                <SectionHeader icon="time-outline" title="Past" count={past.length} colors={colors} />
                {past.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    themeMode={themeMode}
                    colors={colors}
                    onPress={() => setActiveEvent(e)}
                  />
                ))}
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {activeEvent != null && (
        <UnlockDialog
          event={activeEvent}
          themeMode={themeMode}
          onCancel={() => setActiveEvent(null)}
          onUnlocked={(code) => {
            setScannerSession({ event: activeEvent, passcode: code });
            setActiveEvent(null);
          }}
        />
      )}

      {scannerSession != null && (
        <ScannerScreen
          event={scannerSession.event}
          passcode={scannerSession.passcode}
          onClose={() => setScannerSession(null)}
        />
      )}
    </View>
  );
}

function SectionHeader({
  icon,
  title,
  count,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  count: number;
  colors: any;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <Text style={[styles.sectionTitle, { color: colors.muted }]}>
        {title.toUpperCase()}
      </Text>
      <Text style={[styles.sectionCount, { color: colors.muted }]}>{count}</Text>
    </View>
  );
}

function EmptyCard({
  message,
  icon,
  colors,
}: {
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: any;
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name={icon} size={32} color={colors.muted} />
      <Text style={[styles.emptyText, { color: colors.muted }]}>{message}</Text>
    </View>
  );
}

interface EventCardProps {
  event: ScanEvent;
  emphasize?: boolean;
  themeMode: ThemeMode;
  colors: any;
  onPress: () => void;
}

function EventCard({ event, emphasize, themeMode, colors, onPress }: EventCardProps) {
  const isDark = themeMode === 'dark';
  const enabled = canScanEvent(event);
  const status = statusColor(event.status, themeMode);
  const iconBg = emphasize
    ? alpha(FhusoColors.success, 0.12)
    : isDark
      ? FhusoColors.bgDark
      : FhusoColors.surfaceLight;

  return (
    <Pressable
      disabled={!enabled}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[styles.cardIcon, { backgroundColor: iconBg }]}>
        <Ionicons
          name={emphasize ? 'flash' : 'calendar'}
          size={22}
          color={emphasize ? FhusoColors.success : status}
        />
      </View>
      <View style={styles.cardBody}>
        <Text
          style={[
            styles.cardTitle,
            { color: colors.ink },
          ]}
          numberOfLines={2}
        >
          {event.title}
        </Text>
        <Text style={[styles.cardSubtitle, { color: colors.muted }]} numberOfLines={1}>
          {event.location && event.location.length > 0
            ? `${event.location} · ${scheduleLabel(event)}`
            : scheduleLabel(event)}
        </Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: alpha(status, 0.12) }]}>
        <Text style={[styles.statusLabel, { color: status }]}>
          {event.status.toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
}

interface UnlockDialogProps {
  event: ScanEvent;
  themeMode: ThemeMode;
  onCancel: () => void;
  onUnlocked: (code: string) => void;
}

function UnlockDialog({ event, themeMode, onCancel, onUnlocked }: UnlockDialogProps) {
  const [code, setCode] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [offlineConfirm, setOfflineConfirm] = useState(false);
  const isDark = themeMode === 'dark';
  const colors = {
    bg: isDark ? FhusoColors.bgDark : FhusoColors.bgLight,
    surface: isDark ? FhusoColors.surfaceDark : FhusoColors.surfaceLight,
    border: isDark ? FhusoColors.borderDark : FhusoColors.borderLight,
    ink: isDark ? FhusoColors.inkDark : FhusoColors.inkLight,
    muted: isDark ? FhusoColors.mutedDark : FhusoColors.mutedLight,
  };

  async function submit() {
    const c = code.trim();
    if (c.length !== 6) {
      setDialogError('Enter the 6-digit event code.');
      return;
    }
    setVerifying(true);
    try {
      await api.post('/api/mobile/verify', {
        eventId: event.id,
        scanPassword: c,
      });
      setVerifying(false);
      setOfflineConfirm(true);
    } catch (e) {
      setVerifying(false);
      if (e instanceof ApiException) setDialogError(e.message);
      else setDialogError('Could not reach the server.');
    }
  }

  const modalContent = offlineConfirm ? (
    <View style={[styles.dialog, { backgroundColor: colors.bg }]}>
      <Ionicons name="wifi-outline" size={32} color={FhusoColors.brand} />
      <Text style={[styles.dialogTitle, { color: colors.ink }]}>Enter offline mode?</Text>
      <Text style={[styles.dialogBody, { color: colors.muted }]}>
        Wi-Fi/data will be disconnected. Scans will be saved on this device and
        upload automatically when you tap the Sync button. The QR scanner works
        without internet.
      </Text>
      <View style={styles.dialogActions}>
        <Pressable onPress={() => setOfflineConfirm(false)} style={styles.dialogBtn}>
          <Text style={{ color: FhusoColors.brand }}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={() => onUnlocked(code.trim())}
          style={[styles.dialogBtn, styles.dialogPrimary, { backgroundColor: FhusoColors.brand }]}
        >
          <Text style={{ color: '#fff' }}>Go offline</Text>
        </Pressable>
      </View>
    </View>
  ) : (
    <View style={[styles.dialog, { backgroundColor: colors.bg }]}>
      <View style={styles.dialogHeader}>
        <Ionicons name="lock-closed-outline" size={22} color={FhusoColors.brand} />
        <Text style={[styles.dialogTitle, { color: colors.ink }]}>Enter event code</Text>
      </View>
      <Text style={[styles.dialogSubtitle, { color: colors.muted }]}>{event.title}</Text>
      <TextInput
        value={code}
        onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
        style={[
          styles.codeInput,
          {
            backgroundColor: colors.surface,
            borderColor: dialogError ? FhusoColors.danger : colors.border,
            color: colors.ink,
          },
        ]}
        placeholder="6-digit code"
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        secureTextEntry
        autoFocus
        maxLength={6}
        onSubmitEditing={submit}
      />
      {dialogError != null && (
        <Text style={[styles.dialogError, { color: FhusoColors.danger }]}>{dialogError}</Text>
      )}
      <View style={styles.dialogActions}>
        <Pressable onPress={onCancel} style={styles.dialogBtn}>
          <Text style={{ color: FhusoColors.brand }}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={submit}
          disabled={verifying}
          style={[styles.dialogBtn, styles.dialogPrimary, { backgroundColor: FhusoColors.brand }]}
        >
          {verifying ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: '#fff' }}>Unlock</Text>
          )}
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalWrap}>{modalContent}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appBarTitle: { fontSize: 20, fontFamily: FhusoFonts.bold, letterSpacing: -0.3 },
  center: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: { fontSize: 14, textAlign: 'center', marginTop: 16 },
  retryBtn: {
    marginTop: 16,
    height: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  retryLabel: { color: '#fff', fontSize: 15, fontFamily: FhusoFonts.semiBold },
  list: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: FhusoFonts.bold,
    letterSpacing: 1.1,
    marginLeft: 8,
  },
  sectionCount: { fontSize: 12, fontFamily: FhusoFonts.semiBold, marginLeft: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 15, fontFamily: FhusoFonts.bold, lineHeight: 19 },
  cardSubtitle: { fontSize: 13, marginTop: 4 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginLeft: 8,
  },
  statusLabel: { fontSize: 11, fontFamily: FhusoFonts.extraBold },
  emptyText: { fontSize: 14, marginTop: 10, textAlign: 'center' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalWrap: { width: '100%' },
  dialog: {
    borderRadius: 14,
    padding: 20,
  },
  dialogHeader: { flexDirection: 'row', alignItems: 'center' },
  dialogTitle: {
    fontSize: 17,
    fontFamily: FhusoFonts.bold,
    marginLeft: 10,
    marginTop: 0,
  },
  dialogSubtitle: { fontSize: 13, marginTop: 6 },
  dialogBody: { fontSize: 14, marginTop: 12, lineHeight: 20 },
  codeInput: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  dialogError: { fontSize: 13, marginTop: 12 },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
  },
  dialogBtn: {
    height: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  dialogPrimary: { marginLeft: 8 },
});