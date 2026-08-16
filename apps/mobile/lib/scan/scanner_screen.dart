import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../core/api_client.dart';
import '../core/theme.dart';
import '../widgets/constellation_background.dart';
import 'models.dart';
import 'scan_queue.dart';

/// Compact button style (~28px tall) used for the scanner action buttons.
ButtonStyle smallButtonStyle() => ButtonStyle(
      minimumSize: const WidgetStatePropertyAll(Size(0, 28)),
      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      padding: const WidgetStatePropertyAll(
        EdgeInsets.symmetric(horizontal: 12, vertical: 0),
      ),
      textStyle: const WidgetStatePropertyAll(
        TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
      ),
    );

class ScannerScreen extends StatefulWidget {
  final ScanEvent event;
  final String passcode;

  const ScannerScreen({super.key, required this.event, required this.passcode});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final MobileScannerController _scanner = MobileScannerController(
    formats: const [BarcodeFormat.qrCode],
    detectionSpeed: DetectionSpeed.noDuplicates,
  );

  bool _processing = false;
  bool _syncing = false;
  ScanResult? _result;
  List<ScanLogEntry> _history = [];
  int _pending = 0;
  bool _historyOpen = false;
  Timer? _autoReset;

  @override
  void initState() {
    super.initState();
    // The MobileScanner widget auto-starts the controller; calling start()
    // here too races with that initialization and throws controllerInitializing.
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final queue = await ScanQueue.load();
    if (!mounted) return;
    setState(() {
      _pending = queue.length;
      _history = queue
          .map(
            (s) => ScanLogEntry(
              id: s.id,
              studentName: s.studentName,
              studentNo: s.studentNo,
              section: s.section,
              scannedAt: s.scannedAt,
            ),
          )
          .toList()
        ..sort((a, b) => b.scannedAt.compareTo(a.scannedAt));
    });
  }

  int get _readyCount =>
      _history.where((e) => !e.synced && !e.duplicate).length;

  @override
  void dispose() {
    _autoReset?.cancel();
    _scanner.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_processing || _result != null) return;
    final barcode = capture.barcodes.firstOrNull;
    final qrText = barcode?.rawValue;
    if (qrText == null || qrText.isEmpty) return;

    setState(() => _processing = true);
    await _scanner.stop();

    // Parse the QR locally so the result shows instantly, even offline.
    final qr = StudentQr.parse(qrText);
    if (!qr.isValid) {
      if (!mounted) return;
      setState(() {
        _processing = false;
        _result = const ScanResult(
          ok: false,
          message: 'Could not read the student ID from the QR code.',
          alreadyScanned: false,
          fromLocal: true,
        );
      });
      HapticFeedback.vibrate();
      _scheduleAutoReset();
      return;
    }

    // Check the local queue first: if this student was already scanned for
    // this event, it's a duplicate — even offline.
    final queue = await ScanQueue.load();
    final duplicate = queue.any(
      (s) => s.eventId == widget.event.id && s.studentNo == qr.studentNo,
    );
    if (duplicate) {
      if (!mounted) return;
      setState(() {
        _processing = false;
        _history = [
          ScanLogEntry(
            id: DateTime.now().microsecondsSinceEpoch.toString(),
            studentName: qr.name,
            studentNo: qr.studentNo,
            section: qr.section,
            scannedAt: DateTime.now(),
            duplicate: true,
          ),
          ..._history,
        ];
        _result = ScanResult(
          ok: true,
          alreadyScanned: true,
          message: 'Already checked in.',
          studentName: qr.name,
          studentNo: qr.studentNo,
          section: qr.section,
          fromLocal: true,
        );
      });
      HapticFeedback.lightImpact();
      _scheduleAutoReset();
      return;
    }

    // Queue the scan on-device immediately. Upload happens on Sync.
    final scanId = DateTime.now().microsecondsSinceEpoch.toString();
    await ScanQueue.add(QueuedScan(
      id: scanId,
      eventId: widget.event.id,
      eventTitle: widget.event.title,
      scanPassword: widget.passcode,
      qrText: qrText,
      studentName: qr.name,
      studentNo: qr.studentNo,
      section: qr.section,
      scannedAt: DateTime.now(),
    ));

    if (!mounted) return;
    setState(() {
      _processing = false;
      _pending += 1;
      _history = [
        ScanLogEntry(
          id: scanId,
          studentName: qr.name,
          studentNo: qr.studentNo,
          section: qr.section,
          scannedAt: DateTime.now(),
        ),
        ..._history,
      ];
      _result = ScanResult(
        ok: true,
        message: 'Saved on this device. Tap Sync to upload.',
        alreadyScanned: false,
        studentName: qr.name,
        studentNo: qr.studentNo,
        section: qr.section,
        fromLocal: true,
      );
    });
    HapticFeedback.heavyImpact();
    _scheduleAutoReset();
  }

  /// Uploads every queued scan to the server; drops the successful ones.
  Future<void> _sync() async {
    if (_syncing) return;
    setState(() => _syncing = true);

    final queue = await ScanQueue.load();
    if (queue.isEmpty) {
      if (!mounted) return;
      setState(() => _syncing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nothing to sync.')),
      );
      return;
    }

    final synced = <String>[];
    for (final scan in queue) {
      try {
        await api.post('/api/mobile/scan', body: {
          'eventId': scan.eventId,
          'scanPassword': scan.scanPassword,
          'qrText': scan.qrText,
        });
        synced.add(scan.id);
      } on ApiException {
        // Keep this entry; retry on the next sync.
      } catch (_) {
        // Keep this entry; retry on the next sync.
      }
    }

    await ScanQueue.removeByIds(synced);
    if (!mounted) return;
    final syncedIds = synced.toSet();
    setState(() {
      _syncing = false;
      _pending = queue.length - synced.length;
      _history = _history.map((e) {
        if (syncedIds.contains(e.id)) {
          return ScanLogEntry(
            id: e.id,
            studentName: e.studentName,
            studentNo: e.studentNo,
            section: e.section,
            scannedAt: e.scannedAt,
            synced: true,
          );
        }
        return e;
      }).toList();
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          synced.isEmpty
              ? 'Could not sync. Check your connection and try again.'
              : _pending == 0
                  ? 'Synced ${synced.length} scan${synced.length == 1 ? '' : 's'}.'
                  : 'Synced ${synced.length}. $_pending still waiting.',
        ),
      ),
    );
  }

  void _scheduleAutoReset() {
    _autoReset?.cancel();
    _autoReset = Timer(const Duration(milliseconds: 2200), () {
      if (!mounted) return;
      _reset();
    });
  }

  void _reset() {
    _autoReset?.cancel();
    _result = null;
    _scanner.start();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B1220),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B1220),
        foregroundColor: Colors.white,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.event.title,
              style: const TextStyle(fontSize: 16, color: Colors.white),
            ),
            const SizedBox(height: 2),
            const Text(
              'Point at a member\'s QR code',
              style: TextStyle(fontSize: 12, color: Colors.white70),
            ),
          ],
        ),
        actions: const [],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(
            controller: _scanner,
            onDetect: _onDetect,
            errorBuilder: (context, error) => _ScannerError(
              message: error.errorDetails?.message ?? error.errorCode.name,
            ),
          ),
          const _ScanOverlay(),
          if (_processing)
            Container(
              color: const Color(0x66000000),
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            ),
          if (_pending > 0)
            Positioned(
              left: 16,
              top: 16,
              child: _OfflineBadge(count: _pending),
            ),
          if (_result != null)
            _ResultPanel(result: _result!),
          Positioned(
            left: 16,
            bottom: 16,
            child: ValueListenableBuilder(
              valueListenable: _scanner,
              builder: (context, state, _) {
                final on = state.torchState == TorchState.on;
                return FloatingActionButton.small(
                  heroTag: 'torch',
                  backgroundColor: on ? FhusoColors.brand : Colors.white,
                  foregroundColor: on ? Colors.white : FhusoColors.inkLight,
                  onPressed: () => _scanner.toggleTorch(),
                  child: Icon(on ? Icons.flash_on_rounded : Icons.flash_off_rounded),
                );
              },
            ),
          ),
          Positioned(
            right: 16,
            bottom: 16,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                OutlinedButton(
                  onPressed: () => setState(() => _historyOpen = true),
                  style: smallButtonStyle().copyWith(
                    foregroundColor: const WidgetStatePropertyAll(Colors.white),
                    side: const WidgetStatePropertyAll(
                      BorderSide(color: Colors.white38),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Badge.count(
                        count: _readyCount,
                        isLabelVisible: _readyCount > 0,
                        child: const Icon(Icons.history_rounded, size: 16),
                      ),
                      const SizedBox(width: 6),
                      const Text('History'),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: _syncing ? null : _sync,
                  style: smallButtonStyle(),
                  child: _syncing
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.cloud_upload_rounded, size: 16),
                            const SizedBox(width: 6),
                            Text(_pending > 0 ? 'Sync ($_pending)' : 'Sync'),
                          ],
                        ),
                ),
              ],
            ),
          ),
          if (_historyOpen)
            Positioned.fill(
              child: _HistoryPanel(
                history: _history,
                onClose: () => setState(() => _historyOpen = false),
                onSync: _sync,
                syncing: _syncing,
              ),
            ),
        ],
      ),
    );
  }
}

/// Floating pill telling the user scanning is offline and scans are queued.
class _OfflineBadge extends StatelessWidget {
  final int count;

  const _OfflineBadge({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xCC0B1220),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white24),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.wifi_off_rounded, size: 16, color: Colors.white70),
          const SizedBox(width: 8),
          Text(
            count == 0
                ? 'Offline mode'
                : 'Offline · $count queued',
            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _ScanOverlay extends StatelessWidget {
  const _ScanOverlay();

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: CustomPaint(
        size: Size.infinite,
        painter: _ScanFramePainter(),
      ),
    );
  }
}

class _ScanFramePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    const holeSize = 260.0;
    final holeRect = Rect.fromCenter(
      center: size.center(Offset.zero),
      width: holeSize,
      height: holeSize,
    );

    final dim = Paint()..color = const Color(0x99000000);
    canvas.saveLayer(Rect.fromLTWH(0, 0, size.width, size.height), Paint());
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height),
      dim,
    );
    canvas.drawPath(
      Path.combine(
        PathOperation.difference,
        Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height)),
        Path()..addRRect(RRect.fromRectAndRadius(holeRect, const Radius.circular(24))),
      ),
      Paint()..color = const Color(0x99000000),
    );
    canvas.restore();

    final stroke = Paint()
      ..color = FhusoColors.brand
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;
    final rr = RRect.fromRectAndRadius(holeRect, const Radius.circular(24));
    canvas.drawRRect(rr, stroke);
  }

  @override
  bool shouldRepaint(covariant _ScanFramePainter oldDelegate) => false;
}

class _ResultPanel extends StatelessWidget {
  final ScanResult result;

  const _ResultPanel({required this.result});

  @override
  Widget build(BuildContext context) {
    final ok = result.ok;
    final color = ok
        ? (result.alreadyScanned ? FhusoColors.brand : FhusoColors.success)
        : FhusoColors.danger;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? FhusoColors.surfaceDark : FhusoColors.surfaceLight;
    final ink = isDark ? FhusoColors.inkDark : FhusoColors.inkLight;
    final muted = isDark ? FhusoColors.mutedDark : FhusoColors.mutedLight;

    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(
                  ok
                      ? (result.alreadyScanned
                          ? Icons.replay_rounded
                          : Icons.check_circle_rounded)
                      : Icons.cancel_rounded,
                  size: 40,
                  color: color,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ok
                            ? (result.alreadyScanned
                                ? 'Already checked in'
                                : 'Saved')
                            : 'Check-in failed',
                        style: TextStyle(
                          color: color,
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      if (result.message.isNotEmpty)
                        Text(
                          result.message,
                          style: TextStyle(
                            color: muted,
                            fontSize: 13,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            if (result.studentName != null) ...[
              const SizedBox(height: 16),
              _row(Icons.person_rounded, result.studentName!, ink, muted),
              if (result.studentNo != null)
                _row(Icons.badge_rounded, result.studentNo!, ink, muted),
              if (result.section != null)
                _row(Icons.group_rounded, result.section!, ink, muted),
            ],
          ],
        ),
      ),
    );
  }

  Widget _row(IconData icon, String text, Color ink, Color muted) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: muted),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: TextStyle(color: ink, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class _HistoryPanel extends StatelessWidget {
  final List<ScanLogEntry> history;
  final VoidCallback onClose;
  final VoidCallback onSync;
  final bool syncing;

  const _HistoryPanel({
    required this.history,
    required this.onClose,
    required this.onSync,
    required this.syncing,
  });

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }

  String _formatTime(DateTime dt) {
    final d = dt.toLocal();
    final h = d.hour.toString().padLeft(2, '0');
    final m = d.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  Widget _statusChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }

  Widget _entry(ScanLogEntry e, Color ink, Color muted) {
    final Color chipColor;
    final String chipLabel;
    if (e.synced) {
      chipColor = FhusoColors.success;
      chipLabel = 'Synced';
    } else if (e.duplicate) {
      chipColor = FhusoColors.brand;
      chipLabel = 'Already checked in';
    } else {
      chipColor = FhusoColors.warning;
      chipLabel = 'Ready to sync';
    }
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: FhusoColors.brand.withValues(alpha: 0.16),
            foregroundColor: FhusoColors.brand,
            child: Text(_initials(e.studentName), style: const TextStyle(fontSize: 12)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  e.studentName,
                  style: TextStyle(color: ink, fontSize: 14, fontWeight: FontWeight.w700),
                ),
                if (e.studentNo != null)
                  Text(
                    e.studentNo!,
                    style: TextStyle(color: muted, fontSize: 12),
                  ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              _statusChip(chipLabel, chipColor),
              const SizedBox(height: 4),
              Text(
                _formatTime(e.scannedAt),
                style: TextStyle(color: muted, fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ready = history.where((e) => !e.synced && !e.duplicate).toList();
    final synced = history.where((e) => e.synced).toList();
    final duplicates = history.where((e) => e.duplicate).toList();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? FhusoColors.surfaceDark : FhusoColors.surfaceLight;
    final ink = isDark ? FhusoColors.inkDark : FhusoColors.inkLight;
    final muted = isDark ? FhusoColors.mutedDark : FhusoColors.mutedLight;

    return Container(
      color: bg,
      child: SafeArea(
        child: DefaultTabController(
          length: 3,
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.fromLTRB(16, 16, 12, 12),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(color: muted.withValues(alpha: 0.2)),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Scan history',
                            style: TextStyle(
                              color: ink,
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: onClose,
                          icon: const Icon(Icons.close_rounded),
                          color: muted,
                          tooltip: 'Close',
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        _statusChip('${ready.length} ready', FhusoColors.warning),
                        const SizedBox(width: 8),
                        _statusChip('${synced.length} synced', FhusoColors.success),
                        const Spacer(),
                        FilledButton(
                          onPressed: syncing ? null : onSync,
                          style: smallButtonStyle(),
                          child: syncing
                              ? const SizedBox(
                                  width: 14,
                                  height: 14,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : Text(
                                  ready.isNotEmpty
                                      ? 'Sync (${ready.length})'
                                      : 'Sync',
                                ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              TabBar(
                labelColor: FhusoColors.brand,
                unselectedLabelColor: muted,
                indicatorColor: FhusoColors.brand,
                tabs: const [
                  Tab(text: 'Ready to sync'),
                  Tab(text: 'Synced'),
                  Tab(text: 'Already checked in'),
                ],
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    _listView(ready, ink, muted),
                    _listView(synced, ink, muted),
                    _listView(duplicates, ink, muted),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _listView(List<ScanLogEntry> items, Color ink, Color muted) {
    if (items.isEmpty) {
      return Center(
        child: Text('Nothing here.', style: TextStyle(color: muted)),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: items.length,
      separatorBuilder: (_, _) =>
          Divider(height: 1, color: muted.withValues(alpha: 0.15)),
      itemBuilder: (_, i) => _entry(items[i], ink, muted),
    );
  }

}

class _ScannerError extends StatelessWidget {
  final String message;

  const _ScannerError({required this.message});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        const Positioned.fill(
          child: ConstellationBackground(isDark: true),
        ),
        Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.no_photography_rounded, size: 48, color: Colors.white54),
                const SizedBox(height: 16),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white70),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
