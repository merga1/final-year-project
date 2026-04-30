import 'dart:convert';
import 'dart:io';

import '../models/mobile_home_data.dart';

abstract class HomeRepository {
  Future<MobileHomeData> fetchHomeDashboard();
}

class ApiHomeRepository implements HomeRepository {
  ApiHomeRepository({
    HttpClient? httpClient,
    String? baseUrl,
  })  : _httpClient = httpClient ?? HttpClient(),
        _baseUrl = baseUrl ?? _defaultBaseUrl();

  final HttpClient _httpClient;
  final String _baseUrl;

  @override
  Future<MobileHomeData> fetchHomeDashboard() async {
    final uri = Uri.parse('$_baseUrl/api/mobile/home');
    final request = await _httpClient.getUrl(uri);
    final response = await request.close();

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HttpException('Backend responded with ${response.statusCode}', uri: uri);
    }

    final body = await response.transform(utf8.decoder).join();
    final json = jsonDecode(body) as Map<String, dynamic>;
    return MobileHomeData.fromJson(json);
  }

  static String _defaultBaseUrl() {
    const override = String.fromEnvironment('API_BASE_URL');
    if (override.isNotEmpty) {
      return override;
    }

    if (Platform.isAndroid) {
      return 'http://10.0.2.2:4000';
    }

    return 'http://localhost:4000';
  }
}
