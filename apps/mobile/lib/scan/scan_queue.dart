import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// A single attendance scan recorded while offline.
class QueuedScan {
  final String id;
  final String eventId;
  final String eventTitle;
  final String scanPassword;
  final String qrText;
  final String studentName;
  final String? studentNo;
  final String? section;
  final DateTime scannedAt;

  const QueuedScan({
    required this.id,
    required this.eventId,
    required this.eventTitle,
    required this.scanPassword,
    required this.qrText,
    required this.studentName,
    required this.studentNo,
    required this.section,
    required this.scannedAt,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'eventId': eventId,
        'eventTitle': eventTitle,
        'scanPassword': scanPassword,
        'qrText': qrText,
        'studentName': studentName,
        'studentNo': studentNo,
        'section': section,
        'scannedAt': scannedAt.toIso8601String(),
      };

  factory QueuedScan.fromJson(Map<String, dynamic> json) => QueuedScan(
        id: json['id'] as String,
        eventId: json['eventId'] as String,
        eventTitle: json['eventTitle'] as String,
        scanPassword: json['scanPassword'] as String,
        qrText: json['qrText'] as String,
        studentName: json['studentName'] as String,
        studentNo: json['studentNo'] as String?,
        section: json['section'] as String?,
        scannedAt: DateTime.parse(json['scannedAt'] as String),
      );
}

/// Persistent offline queue of attendance scans.
///
/// Scans are stored on-device so the scanner works with Wi-Fi/data off.
/// A [sync] uploads every entry to the server and drops the successful ones.
class ScanQueue {
  static const _key = 'scan_queue_v1';

  static Future<List<QueuedScan>> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list
          .map((e) => QueuedScan.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> save(List<QueuedScan> queue) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _key,
      jsonEncode(queue.map((e) => e.toJson()).toList()),
    );
  }

  /// Adds a scan to the persistent queue.
  static Future<void> add(QueuedScan scan) async {
    final queue = await load();
    queue.add(scan);
    await save(queue);
  }

  /// Removes queued scans with the given ids.
  static Future<void> removeByIds(Iterable<String> ids) async {
    final idSet = ids.toSet();
    final queue = await load();
    queue.removeWhere((e) => idSet.contains(e.id));
    await save(queue);
  }

  /// Clears the entire queue.
  static Future<void> clear() => save([]);
}
