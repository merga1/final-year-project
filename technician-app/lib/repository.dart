import 'core/api_client.dart';
import 'models/technician_models.dart';

class TechnicianRepository {
  TechnicianRepository(this.client);
  final TechnicianApiClient client;

  Future<TechnicianSummary> fetchSummary() async => TechnicianSummary.fromJson(Map<String, dynamic>.from(await client.get('/api/technician/home') as Map));

  Future<List<TechnicianTicket>> fetchTickets({String? status}) async {
    final suffix = status == null || status == 'All' ? '' : '?status=${Uri.encodeQueryComponent(status.toLowerCase())}';
    final json = await client.get('/api/technician/tickets$suffix') as List<dynamic>;
    return json.map((item) => TechnicianTicket.fromJson(Map<String, dynamic>.from(item as Map))).toList();
  }

  Future<TechnicianTicket> updateTicket(String id, Map<String, dynamic> body) async => TechnicianTicket.fromJson(Map<String, dynamic>.from(await client.patch('/api/technician/tickets/$id', body) as Map));

  Future<DeviceSnapshot> fetchDevice(String ticketId) async => DeviceSnapshot.fromJson(Map<String, dynamic>.from(await client.get('/api/technician/tickets/$ticketId/device') as Map));

  Future<List<TechnicianNotification>> fetchNotifications() async {
    final json = Map<String, dynamic>.from(await client.get('/api/notifications') as Map);
    return (json['items'] as List<dynamic>? ?? []).map((item) => TechnicianNotification.fromJson(Map<String, dynamic>.from(item as Map))).toList();
  }

  Future<void> markRead(String id) => client.patch('/api/notifications/$id/read', {}).then((_) {});
  Future<void> markAllRead() => client.patch('/api/notifications/read-all', {}).then((_) {});
}
