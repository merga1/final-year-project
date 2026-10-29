import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

class TechnicianAuthService {
  TechnicianAuthService(this.client, {FlutterSecureStorage? storage}) : _storage = storage ?? const FlutterSecureStorage();
  final TechnicianApiClient client;
  final FlutterSecureStorage _storage;
  static const _tokenKey = 'technician_token';
  static const _nameKey = 'technician_name';
  static const _emailKey = 'technician_email';

  Future<void> login(String email, String password) async {
    final json = await client.post('/auth/login', {'email': email.trim(), 'password': password});
    client.token = json['accessToken'] as String;
    final user = Map<String, dynamic>.from(json['user'] as Map);
    if (user['role'] != 'technician') throw Exception('This account is not a technician account');
    await _storage.write(key: _tokenKey, value: client.token);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_nameKey, user['name']?.toString() ?? 'Technician');
    await prefs.setString(_emailKey, user['email']?.toString() ?? email);
  }

  Future<bool> restore() async {
    String? token;
    try { token = await _storage.read(key: _tokenKey); } catch (_) {}
    if (token == null || token.isEmpty) return false;
    client.token = token;
    return true;
  }

  Future<Map<String, String>> profile() async {
    final prefs = await SharedPreferences.getInstance();
    return {'name': prefs.getString(_nameKey) ?? 'Technician', 'email': prefs.getString(_emailKey) ?? ''};
  }

  Future<void> logout() async {
    client.token = null;
    try { await _storage.delete(key: _tokenKey); } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
