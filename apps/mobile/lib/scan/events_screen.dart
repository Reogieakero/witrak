import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/api_client.dart';
import '../core/theme.dart';
import 'models.dart';
import 'scanner_screen.dart';

class EventsScreen extends StatefulWidget {
  final ThemeMode themeMode;
  final VoidCallback onToggleTheme;

  const EventsScreen({
    super.key,
    required this.themeMode,
    required this.onToggleTheme,
  });

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  List<ScanEvent>? _events;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      print('[events] loading events from base: ${api.baseUrl}');
      final json = await api.get('/api/mobile/events');
      final events = (json['events'] as List<dynamic>? ?? [])
          .map((e) => ScanEvent.fromJson(e as Map<String, dynamic>))
          .toList();
      if (!mounted) return;
      setState(() {
        _events = events;
        _loading = false;
      });
    } on ApiException catch (e) {
      print('[events] ApiException: ${e.statusCode} ${e.message}');
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (e, stack) {
      print('[events] unexpected error: $e');
      print('[events] $stack');
      if (!mounted) return;
      setState(() {
        _error = 'Could not load events. Check your connection.';
        _loading = false;
      });
    }
  }

  Future<void> _unlock(ScanEvent event) async {
    final controller = TextEditingController();
    String? error;

    final passcode = await showDialog<String>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          void submit() async {
            final code = controller.text.trim();
            if (code.length != 6) {
              setDialogState(() => error = 'Enter the 6-digit event code.');
              return;
            }
            try {
              await api.post('/api/mobile/verify', body: {
                'eventId': event.id,
                'scanPassword': code,
              });
              if (context.mounted) Navigator.of(context).pop(code);
            } on ApiException catch (e) {
              setDialogState(() => error = e.message);
            } catch (_) {
              setDialogState(() => error = 'Could not reach the server.');
            }
          }

          return AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.lock_outline_rounded, size: 22, color: FhusoColors.brand),
                SizedBox(width: 10),
                Text('Enter event code'),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event.title,
                  style: TextStyle(
                    fontSize: 13,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: controller,
                  autofocus: true,
                  obscureText: true,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => submit(),
                  decoration: const InputDecoration(
                    labelText: 'Event code',
                    counterText: '',
                    hintText: '6-digit code',
                  ),
                ),
                if (error != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    error!,
                    style: const TextStyle(color: FhusoColors.danger, fontSize: 13),
                  ),
                ],
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: submit,
                child: const Text('Unlock'),
              ),
            ],
          );
        },
      ),
    );

    if (passcode == null || !mounted) return;

    // After the correct code, switch to offline scanning mode. Tell the user
    // that Wi-Fi/data will be disconnected so scans are smooth and queued
    // locally until they tap Sync.
    final proceed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        icon: const Icon(Icons.wifi_off_rounded, color: FhusoColors.brand, size: 32),
        title: const Text('Enter offline mode?'),
        content: const Text(
          'Wi-Fi/data will be disconnected. Scans will be saved on this '
          'device and upload automatically when you tap the Sync button. '
          'The QR scanner works without internet.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Go offline'),
          ),
        ],
      ),
    );
    if (proceed != true || !mounted) return;

    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ScannerScreen(event: event, passcode: passcode),
      ),
    );
  }

  String _schedule(ScanEvent e) {
    String two(int n) => n.toString().padLeft(2, '0');
    String time(DateTime d) => '${two(d.hour)}:${two(d.minute)}';
    final months = const [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[e.startsAt.month - 1]} ${e.startsAt.day} · '
        '${time(e.startsAt)} – ${time(e.endsAt)}';
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'live':
        return FhusoColors.success;
      case 'upcoming':
        return FhusoColors.brand;
      default:
        return Theme.of(context).colorScheme.onSurfaceVariant;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.themeMode == ThemeMode.dark;
    final canvas = isDark ? FhusoColors.canvasDark : FhusoColors.canvasLight;
    final muted = isDark ? FhusoColors.mutedDark : FhusoColors.mutedLight;
    final ink = isDark ? FhusoColors.inkDark : FhusoColors.inkLight;

    return Scaffold(
      backgroundColor: canvas,
      appBar: AppBar(
        title: const Text('Liberal Scanner'),
        actions: [
          IconButton(
            onPressed: widget.onToggleTheme,
            tooltip: isDark ? 'Switch to light mode' : 'Switch to dark mode',
            icon: Icon(
              isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        color: FhusoColors.brand,
        child: _buildBody(canvas, muted, ink),
      ),
    );
  }

  Widget _buildBody(Color canvas, Color muted, Color ink) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return ListView(
        children: [
          const SizedBox(height: 120),
          Icon(Icons.cloud_off_rounded, size: 48, color: muted),
          const SizedBox(height: 16),
          Text(
            _error!,
            textAlign: TextAlign.center,
            style: TextStyle(color: muted),
          ),
          const SizedBox(height: 16),
          Center(
            child: FilledButton.tonal(
              onPressed: _load,
              child: const Text('Retry'),
            ),
          ),
        ],
      );
    }

    final events = _events ?? const <ScanEvent>[];
    final live = events.where((e) => e.status == 'live').toList();
    final upcoming = events.where((e) => e.status == 'upcoming').toList();
    final past = events.where((e) => e.status == 'past').toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
      children: [
        const SizedBox(height: 12),
        _sectionHeader(Icons.bolt_rounded, 'Live now', live.length),
        if (live.isEmpty)
          _emptyCard('No live events right now.', Icons.schedule_rounded)
        else
          ...live.map((e) => _eventCard(e, emphasize: true)),

        if (upcoming.isNotEmpty) ...[
          const SizedBox(height: 24),
          _sectionHeader(Icons.event_rounded, 'Upcoming', upcoming.length),
          ...upcoming.map((e) => _eventCard(e)),
        ],

        if (past.isNotEmpty) ...[
          const SizedBox(height: 24),
          _sectionHeader(Icons.history_rounded, 'Past', past.length),
          ...past.map((e) => _eventCard(e)),
        ],
      ],
    );
  }

  Widget _sectionHeader(IconData icon, String title, int count) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 16, color: muted),
          const SizedBox(width: 8),
          Text(
            title.toUpperCase(),
            style: TextStyle(
              color: muted,
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.1,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '$count',
            style: TextStyle(color: muted, fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget _emptyCard(String message, IconData icon) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 28),
        child: Column(
          children: [
            Icon(icon, size: 32, color: muted),
            const SizedBox(height: 10),
            Text(
              message,
              style: TextStyle(color: muted, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  Widget _eventCard(ScanEvent e, {bool emphasize = false}) {
    final isDark = widget.themeMode == ThemeMode.dark;
    final muted = isDark ? FhusoColors.mutedDark : FhusoColors.mutedLight;
    final ink = isDark ? FhusoColors.inkDark : FhusoColors.inkLight;
    final statusColor = _statusColor(e.status);
    final enabled = e.canScan;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Card(
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: enabled ? () => _unlock(e) : null,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: emphasize
                        ? statusColor.withValues(alpha: 0.12)
                        : (isDark ? FhusoColors.bgDark : FhusoColors.surfaceLight),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: emphasize
                      ? const Icon(Icons.bolt_rounded, color: FhusoColors.success, size: 22)
                      : Icon(
                          Icons.event_rounded,
                          color: statusColor,
                          size: 22,
                        ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        e.title,
                        style: TextStyle(
                          color: ink,
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          height: 1.25,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        e.location == null || e.location!.isEmpty
                            ? _schedule(e)
                            : '${e.location} · ${_schedule(e)}',
                        style: TextStyle(color: muted, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    e.status.toUpperCase(),
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
