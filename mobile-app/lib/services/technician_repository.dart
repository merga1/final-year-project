import '../core/api_client.dart';
import '../models/technician_models.dart';

class TechnicianRepository {
  TechnicianRepository(this._client);

  final ApiClient _client;

  Future<TechnicianSummary> fetchSummary() async =>
      TechnicianSummary.fromJson(Map<String, dynamic>.from(
          await _client.get('/api/technician/home') as Map));

  Future<List<TechnicianTicket>> fetchTickets({String? status}) async {
    final suffix = status == null || status == 'All'
        ? ''
        : '?status=${Uri.encodeQueryComponent(status.toLowerCase().replaceAll(' ', '_'))}';
    final json = await _client.get('/api/technician/tickets$suffix')
        as List<dynamic>;
    return json
        .map((item) => TechnicianTicket.fromJson(
            Map<String, dynamic>.from(item as Map)))
        .toList();
  }

  Future<void> updateTicket(String id, Map<String, dynamic> body) async {
    await _client.patch('/api/technician/tickets/$id', body);
  }

  Future<TechnicianDeviceSnapshot> fetchDevice(String ticketId) async =>
      TechnicianDeviceSnapshot.fromJson(Map<String, dynamic>.from(
          await _client.get('/api/technician/tickets/$ticketId/device') as Map));

  Future<List<TechnicianNotification>> fetchNotifications() async {
    final json = Map<String, dynamic>.from(
        await _client.get('/api/notifications') as Map);
    final items = json['items'] as List<dynamic>? ?? [];
    return items
        .map((item) => TechnicianNotification.fromJson(
            Map<String, dynamic>.from(item as Map)))
        .toList();
  }

  Future<void> markNotificationRead(String id) async {
    await _client.patch('/api/notifications/$id/read', {});
  }

  Future<void> markAllNotificationsRead() async {
    await _client.patch('/api/notifications/read-all', {});
  }

  /// Saves the GPS coordinates of the water meter linked to [ticketId].
  Future<void> updateMeterLocation(
      String ticketId, double latitude, double longitude) async {
    await _client.patch('/api/technician/tickets/$ticketId/meter-location', {
      'latitude': latitude,
      'longitude': longitude,
    });
  }
}
