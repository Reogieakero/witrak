class ScanEvent {
  final String id;
  final String title;
  final String? location;
  final String status;
  final DateTime startsAt;
  final DateTime endsAt;

  const ScanEvent({
    required this.id,
    required this.title,
    required this.location,
    required this.status,
    required this.startsAt,
    required this.endsAt,
  });

  bool get canScan => status != 'past';

  factory ScanEvent.fromJson(Map<String, dynamic> json) => ScanEvent(
        id: json['id'] as String,
        title: json['title'] as String,
        location: json['location'] as String?,
        status: json['status'] as String,
        startsAt: DateTime.parse(json['startsAt'] as String).toLocal(),
        endsAt: DateTime.parse(json['endsAt'] as String).toLocal(),
      );
}

class ScanResult {
  final bool ok;
  final String message;
  final bool alreadyScanned;
  final String? studentName;
  final String? studentNo;
  final String? section;
  final bool fromLocal;

  const ScanResult({
    required this.ok,
    required this.message,
    required this.alreadyScanned,
    this.studentName,
    this.studentNo,
    this.section,
    this.fromLocal = false,
  });

  factory ScanResult.fromJson(Map<String, dynamic> json) => ScanResult(
        ok: json['ok'] as bool,
        message: json['message'] as String? ?? '',
        alreadyScanned: json['alreadyScanned'] as bool? ?? false,
        studentName: json['student']?['name'] as String?,
        studentNo: json['student']?['studentNo'] as String?,
        section: json['student']?['section'] as String?,
      );
}

/// A single student scan recorded in the scanner's on-screen history.
class ScanLogEntry {
  final String id;
  final String studentName;
  final String? studentNo;
  final String? section;
  final DateTime scannedAt;
  final bool synced;
  final bool duplicate;

  const ScanLogEntry({
    required this.id,
    required this.studentName,
    required this.studentNo,
    required this.section,
    required this.scannedAt,
    this.synced = false,
    this.duplicate = false,
  });
}

/// Parsed student identity embedded in the student ID QR code.
///
/// The QR payload is plain text in the shape:
///   Liberal Scanner Student ID
///   `Name: <full name>`
///   `Student No: <no>`
///   `Section: <label>`
///   `Email: <email>`
class StudentQr {
  final String name;
  final String studentNo;
  final String? section;
  final String? email;
  final String raw;

  const StudentQr({
    required this.name,
    required this.studentNo,
    required this.section,
    required this.email,
    required this.raw,
  });

  bool get isValid => name.isNotEmpty && studentNo.isNotEmpty;

  factory StudentQr.parse(String raw) {
    String line(String label) {
      for (final l in raw.split('\n')) {
        final t = l.trim();
        if (t.toLowerCase().startsWith(label.toLowerCase())) {
          final v = t.substring(label.length).trim();
          if (v.isNotEmpty) return v;
        }
      }
      return '';
    }

    return StudentQr(
      name: line('Name:'),
      studentNo: line('Student No:'),
      section: line('Section:'),
      email: line('Email:'),
      raw: raw,
    );
  }
}
