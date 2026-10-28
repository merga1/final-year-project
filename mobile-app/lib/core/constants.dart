import 'package:shared_preferences/shared_preferences.dart';

class ApiConstants {
  static const String _prefKey = 'smart_water_custom_base_url';
  static String? _inMemoryBaseUrl;

  static const String defaultLocalUrl = 'http://127.0.0.1:4000';
  static const String defaultWifiUrl = 'http://192.168.11.137:4000';
  static const String defaultEmulatorUrl = 'http://10.0.2.2:4000';

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _inMemoryBaseUrl = prefs.getString(_prefKey);
  }

  static Future<void> setBaseUrl(String url) async {
    var cleaned = url.trim();
    if (cleaned.endsWith('/')) {
      cleaned = cleaned.substring(0, cleaned.length - 1);
    }
    _inMemoryBaseUrl = cleaned;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, cleaned);
  }

  static String get baseUrl {
    if (_inMemoryBaseUrl != null && _inMemoryBaseUrl!.isNotEmpty) {
      return _inMemoryBaseUrl!;
    }
    const override = String.fromEnvironment('API_BASE_URL');
    if (override.isNotEmpty) return override;

    // Default to Wi-Fi LAN IP (192.168.11.137:4000) for physical devices on local network
    return defaultWifiUrl;
  }
}
