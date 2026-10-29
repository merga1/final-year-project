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
      final res = await requestFn(primaryBase).timeout(const Duration(seconds: 4));
      _checkStatus(res, path);
      return jsonDecode(res.body);
    } catch (e) {
      final fallbackBase = (primaryBase == ApiConstants.defaultLocalUrl)
          ? ApiConstants.defaultWifiUrl
          : ApiConstants.defaultLocalUrl;

      if (e is SocketException ||
          e is http.ClientException ||
          e is TimeoutException ||
          e.toString().contains('Connection refused') ||
          e.toString().contains('SocketException')) {
        try {
          final res = await requestFn(fallbackBase).timeout(const Duration(seconds: 4));
          _checkStatus(res, path);
          await ApiConstants.setBaseUrl(fallbackBase);
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
    if (res.statusCode == 401) throw Exception('Unauthorized — please log in again');
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception('HTTP ${res.statusCode} at $path');
    }
  }
}
