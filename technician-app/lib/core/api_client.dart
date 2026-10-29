import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class TechnicianApiClient {
  TechnicianApiClient({String? baseUrl}) : baseUrl = baseUrl ?? _defaultBaseUrl();
  String baseUrl;
  String? token;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<dynamic> _request(String method, String path, [Map<String, dynamic>? body]) async {
    try {
      final response = await _send(method, '$baseUrl$path', body).timeout(const Duration(seconds: 8));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        final decoded = jsonDecode(response.body);
        throw Exception(decoded is Map && decoded['message'] is String ? decoded['message'] : 'Request failed (${response.statusCode})');
      }
      return response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body);
    } on SocketException {
      throw Exception('You appear to be offline. Check your connection and try again.');
    } on TimeoutException {
      throw Exception('The request timed out. Please try again.');
    }
  }

  Future<http.Response> _send(String method, String url, Map<String, dynamic>? body) {
    final uri = Uri.parse(url);
    final encoded = body == null ? null : jsonEncode(body);
    switch (method) {
      case 'POST': return http.post(uri, headers: _headers, body: encoded);
      case 'PATCH': return http.patch(uri, headers: _headers, body: encoded);
      default: return http.get(uri, headers: _headers);
    }
  }

  Future<dynamic> get(String path) => _request('GET', path);
  Future<dynamic> post(String path, Map<String, dynamic> body) => _request('POST', path, body);
  Future<dynamic> patch(String path, Map<String, dynamic> body) => _request('PATCH', path, body);

  static String _defaultBaseUrl() {
    const override = String.fromEnvironment('API_BASE_URL');
    if (override.isNotEmpty) return override;
    return Platform.isAndroid ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
  }
}
