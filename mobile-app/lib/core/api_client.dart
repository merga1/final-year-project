import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'constants.dart';

class ApiClient {
  ApiClient({this.token});

  String? token;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<dynamic> _executeWithFallback(
    Future<http.Response> Function(String baseUrl) requestFn,
    String path,
  ) async {
    final primaryBase = ApiConstants.baseUrl;
    try {
      final res = await requestFn(primaryBase).timeout(const Duration(seconds: 15));
      _checkStatus(res, path);
      return jsonDecode(res.body);
    } catch (e) {
      final isConnectionIssue = e is SocketException ||
          e is http.ClientException ||
          e is TimeoutException ||
          e.toString().contains('Connection refused') ||
          e.toString().contains('SocketException') ||
          e.toString().contains('SocketConnection');

      // If a local URL (e.g. 127.0.0.1 or 192.168.x) was refused, auto-fallback to live Cloud URL
      if (isConnectionIssue && primaryBase != ApiConstants.defaultCloudUrl) {
        try {
          final res = await requestFn(ApiConstants.defaultCloudUrl)
              .timeout(const Duration(seconds: 15));
          _checkStatus(res, path);
          await ApiConstants.setBaseUrl(ApiConstants.defaultCloudUrl);
          return jsonDecode(res.body);
        } catch (_) {
          rethrow;
        }
      }
      rethrow;
    }
  }

  Future<dynamic> get(String path) async {
    return _executeWithFallback((baseUrl) {
      final uri = Uri.parse('$baseUrl$path');
      return http.get(uri, headers: _headers);
    }, path);
  }

  Future<dynamic> post(String path, Map<String, dynamic> body) async {
    return _executeWithFallback((baseUrl) {
      final uri = Uri.parse('$baseUrl$path');
      return http.post(uri, headers: _headers, body: jsonEncode(body));
    }, path);
  }

  Future<dynamic> patch(String path, Map<String, dynamic> body) async {
    return _executeWithFallback((baseUrl) {
      final uri = Uri.parse('$baseUrl$path');
      return http.patch(uri, headers: _headers, body: jsonEncode(body));
    }, path);
  }

  void _checkStatus(http.Response res, String path) {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      String? message;
      try {
        final decoded = jsonDecode(res.body);
        if (decoded is Map<String, dynamic>) {
          final value = decoded['message'];
          if (value is String) message = value;
          if (value is List) message = value.join(', ');
        }
      } catch (_) {}

      if (res.statusCode == 401) {
        throw Exception(message ?? 'Unauthorized — please log in again');
      }
      throw Exception(message ?? 'HTTP ${res.statusCode} at $path');
    }
  }
}
