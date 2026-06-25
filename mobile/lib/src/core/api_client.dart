import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'config.dart';
import 'session_store.dart';

final sessionStore = SessionStore(const FlutterSecureStorage());
final apiClientProvider = Provider((ref) => ApiClient());

class ApiClient {
  ApiClient({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<dynamic> get(String path) => _send('GET', path);
  Future<dynamic> post(String path, Map<String, dynamic> body) => _send('POST', path, body: body);
  Future<dynamic> patch(String path, Map<String, dynamic> body) => _send('PATCH', path, body: body);

  Future<dynamic> _send(String method, String path, {Map<String, dynamic>? body}) async {
    final token = await sessionStore.accessToken();
    final uri = Uri.parse('${AppConfig.apiBaseUrl}$path');
    final headers = <String, String>{
      'content-type': 'application/json',
      if (token != null) 'authorization': 'Bearer $token',
    };

    final requestBody = body == null ? null : jsonEncode(body);
    final response = switch (method) {
      'GET' => await _client.get(uri, headers: headers),
      'POST' => await _client.post(uri, headers: headers, body: requestBody),
      'PATCH' => await _client.patch(uri, headers: headers, body: requestBody),
      _ => throw StateError('Unsupported method $method'),
    };

    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, response.body);
    }

    if (response.body.isEmpty) {
      return null;
    }

    return jsonDecode(response.body);
  }
}

class ApiException implements Exception {
  ApiException(this.statusCode, this.body);

  final int statusCode;
  final String body;

  @override
  String toString() => 'ApiException($statusCode): $body';
}
