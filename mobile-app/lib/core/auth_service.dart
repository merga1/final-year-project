import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

class AuthService {
  static const _tokenKey = 'sw_token';
  static const _nameKey = 'sw_name';
  static const _emailKey = 'sw_email';
  static const _meterIdKey = 'sw_meterId';

  final ApiClient _client;

  AuthService(this._client);

  Future<bool> login(String email, String password) async {
    final data = await _client.post('/auth/login', {
      'email': email,
      'password': password,
    });

    final token = data['accessToken'] as String;
    final user = data['user'] as Map<String, dynamic>;

    _client.token = token;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_nameKey, user['name'] as String? ?? '');
    await prefs.setString(_emailKey, user['email'] as String? ?? '');
    await prefs.setString(_meterIdKey, user['meterId'] as String? ?? '');
    return true;
  }

  Future<bool> tryRestoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    if (token == null || token.isEmpty) return false;
    _client.token = token;
    return true;
  }

  Future<Map<String, String>> getStoredUser() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'name': prefs.getString(_nameKey) ?? '',
      'email': prefs.getString(_emailKey) ?? '',
      'meterId': prefs.getString(_meterIdKey) ?? '',
    };
  }

  Future<void> logout() async {
    _client.token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  bool get isLoggedIn => _client.token != null;
}
