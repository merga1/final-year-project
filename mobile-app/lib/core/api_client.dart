import 'dart:convert';
import 'package:http/http.dart' as http;
import 'constants.dart';

class ApiClient {
  ApiClient({this.token});

  String? token;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<dynamic> get(String path) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}$path');
    final res = await http.get(uri, headers: _headers);
    _checkStatus(res, path);
    return jsonDecode(res.body);
  }

  Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}$path');
    final res = await http.post(uri, headers: _headers, body: jsonEncode(body));
    _checkStatus(res, path);
    return jsonDecode(res.body);
  }

  void _checkStatus(http.Response res, String path) {
    if (res.statusCode == 401) throw Exception('Unauthorized — please log in again');
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception('HTTP ${res.statusCode} at $path');
    }
  }
}
