import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

class AuthService {
  static const _tokenKey = 'sw_token';
  static const _nameKey = 'sw_name';
  static const _emailKey = 'sw_email';
  static const _meterIdKey = 'sw_meterId';
  static const _roleKey = 'sw_role';
  static const _userIdKey = 'sw_userId';

  final ApiClient _client;
  final FlutterSecureStorage _secureStorage;

  AuthService(this._client, {FlutterSecureStorage? secureStorage})
      : _secureStorage = secureStorage ?? const FlutterSecureStorage();

  Future<bool> login(String email, String password, {bool rememberMe = true}) async {
    if (email.trim().isEmpty || !email.contains('@')) {
      throw Exception('Enter a valid email address');
    }
    if (password.isEmpty) throw Exception('Enter your password');

    final data = await _client.post('/auth/login', {
      'email': email.trim(),
      'password': password,
    });
    final token = data['accessToken'] as String;
    final user = Map<String, dynamic>.from(data['user'] as Map);
    _client.token = token;
    final prefs = await SharedPreferences.getInstance();
    await _secureStorage.write(key: _tokenKey, value: rememberMe ? token : null);
    await prefs.setString(_nameKey, user['name'] as String? ?? '');
    await prefs.setString(_emailKey, user['email'] as String? ?? '');
    await prefs.setString(_meterIdKey, user['meterId'] as String? ?? '');
    await prefs.setString(_roleKey, user['role'] as String? ?? 'customer');
    await prefs.setString(_userIdKey, user['sub']?.toString() ?? '');
    if (rememberMe) await prefs.setString(_tokenKey, token);
    return true;
  }

  Future<bool> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? dateOfBirth,
    String? address,
    String? meterId,
  }) async {
    if (firstName.trim().isEmpty || lastName.trim().isEmpty) {
      throw Exception('Enter your first and last name');
    }
    if (password.length < 6) throw Exception('Password must be at least 6 characters');
    final data = await _client.post('/auth/register', {
      'name': '${firstName.trim()} ${lastName.trim()}',
      'firstName': firstName.trim(),
      'lastName': lastName.trim(),
      'email': email.trim(),
      'password': password,
      'dateOfBirth': dateOfBirth,
      'address': address,
      'meterId': meterId,
    });
    final token = data['accessToken'] as String;
    final user = Map<String, dynamic>.from(data['user'] as Map);
    _client.token = token;
    final prefs = await SharedPreferences.getInstance();
    await _secureStorage.write(key: _tokenKey, value: token);
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_nameKey, user['name'] as String? ?? '');
    await prefs.setString(_emailKey, user['email'] as String? ?? '');
    await prefs.setString(_meterIdKey, user['meterId'] as String? ?? '');
    await prefs.setString(_roleKey, user['role'] as String? ?? 'customer');
    await prefs.setString(_userIdKey, user['sub']?.toString() ?? '');
    return true;
  }

  Future<void> forgotPassword(String email) async {
    await _client.post('/auth/forgot-password', {'email': email.trim()});
  }

  Future<void> changePassword(String oldPassword, String newPassword) async {
    await _client.post('/auth/change-password', {
      'oldPassword': oldPassword,
      'newPassword': newPassword,
    });
  }

  Future<bool> tryRestoreSession() async {
    String? token;
    try {
      token = await _secureStorage.read(key: _tokenKey);
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    token ??= prefs.getString(_tokenKey);
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
      'role': prefs.getString(_roleKey) ?? 'customer',
      'userId': prefs.getString(_userIdKey) ?? '',
    };
  }

  Future<void> logout() async {
    _client.token = null;
    try {
      await _secureStorage.delete(key: _tokenKey);
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  bool get isLoggedIn => _client.token != null;
}
