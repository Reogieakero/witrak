import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException(this.statusCode, this.message);

  bool get unauthorized => statusCode == 401;
  bool get forbidden => statusCode == 403;

  @override
  String toString() => message;
}

class ApiClient {
  final http.Client _client = http.Client();
  String? _token;

  String get _baseUrl => AppConfig.apiBaseUrl;

  String get baseUrl => _baseUrl;

  void updateToken(String? token) {
    _token = token;
  }

  String? get currentToken => _token;

  Map<String, String> _headers() => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Future<Map<String, dynamic>> get(String path) async {
    final uri = Uri.parse('$_baseUrl$path');
    print('[api] GET $uri');
    try {
      final res = await _client
          .get(uri, headers: _headers())
          .timeout(const Duration(seconds: 12));
      print('[api] GET $uri -> ${res.statusCode}');
      return _decode(res);
    } on TimeoutException {
      throw ApiException(
        0,
        'Could not reach the server. Check your connection or the API address.',
      );
    }
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$_baseUrl$path');
    print('[api] POST $uri');
    try {
      final res = await _client
          .post(
            uri,
            headers: _headers(),
            body: body == null ? null : jsonEncode(body),
          )
          .timeout(const Duration(seconds: 12));
      print('[api] POST $uri -> ${res.statusCode}');
      return _decode(res);
    } on TimeoutException {
      throw ApiException(
        0,
        'Could not reach the server. Check your connection or the API address.',
      );
    }
  }

  Map<String, dynamic> _decode(http.Response res) {
    Map<String, dynamic>? json;
    try {
      json = jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      json = null;
    }
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return json ?? const {};
    }
    print('[api] ERROR ${res.statusCode}: ${res.body}');
    throw ApiException(
      res.statusCode,
      json?['error']?.toString() ?? 'Something went wrong (${res.statusCode}).',
    );
  }

  void dispose() => _client.close();
}

final ApiClient api = ApiClient();

void syncApiToken() {
  api.updateToken(Supabase.instance.client.auth.currentSession?.accessToken);
}
