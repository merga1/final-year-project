import '../core/api_client.dart';
import 'mobile_home_data.dart';

class Bill {
  const Bill({
    required this.id,
    required this.periodStart,
    required this.periodEnd,
    required this.usageLiters,
    required this.amountEtb,
    required this.status,
    required this.dueDate,
    this.rate = 5.0,
  });

  final String id;
  final String periodStart;
  final String periodEnd;
  final double usageLiters;
  final double amountEtb;
  final String status;
  final String dueDate;
  final double rate;

  factory Bill.fromJson(Map<String, dynamic> j) => Bill(
        id: j['id'] as String,
        periodStart: j['periodStart'] as String? ?? '2025-05-01',
        periodEnd: j['periodEnd'] as String? ?? '2025-05-30',
        usageLiters: (j['usageLiters'] as num?)?.toDouble() ?? 1002.0,
        amountEtb: (j['amountEtb'] as num?)?.toDouble() ?? 5010.0,
        status: j['status'] as String? ?? 'pending',
        dueDate: j['dueDate'] as String? ?? '30/05/2025',
        rate: (j['rate'] as num?)?.toDouble() ?? 5.0,
      );
}

class DailyUsage {
  const DailyUsage({required this.day, required this.usageLiters});
  final String day;
  final double usageLiters;

  factory DailyUsage.fromJson(Map<String, dynamic> j) => DailyUsage(
        day: j['day'] as String,
        usageLiters: double.tryParse(j['usageLiters']?.toString() ?? '0') ?? 0,
      );
}

class SupportTicket {
  const SupportTicket({
    required this.id,
    required this.issue,
    required this.priority,
    required this.status,
    required this.createdAt,
    this.type = 'Sensor Issue',
    this.description = '',
    this.technicianId,
  });

  final String id;
  final String issue;
  final String priority;
  final String status;
  final String createdAt;
  final String type;
  final String description;
  final String? technicianId;

  factory SupportTicket.fromJson(Map<String, dynamic> j) {
    return SupportTicket(
      id: j['id'] as String,
      issue: j['issue'] as String? ?? 'Sensor Issue',
      priority: j['priority'] as String? ?? 'Medium',
      status: j['status'] as String? ?? 'open',
      createdAt: j['createdAt'] as String? ?? DateTime.now().toIso8601String(),
      type: j['type'] as String? ?? 'Sensor Issue',
      description: j['description'] as String? ?? (j['issue'] as String? ?? ''),
      technicianId: j['technicianId'] as String?,
    );
  }
}

class MobileRepository {
  MobileRepository(this._client);
  final ApiClient _client;

  Future<MobileHomeData> fetchHome() async {
    final json = await _client.get('/api/mobile/home');
    return MobileHomeData.fromJson(Map<String, dynamic>.from(json as Map));
  }

  Future<Map<String, dynamic>> toggleValve([String? nextState]) async {
    final body = nextState != null ? {'valveState': nextState} : <String, dynamic>{};
    final res = await _client.post('/api/mobile/valve', body);
    return Map<String, dynamic>.from(res as Map);
  }

  Future<List<DailyUsage>> fetchDailyUsage() async {
    final list =
        await _client.get('/api/mobile/readings/daily') as List<dynamic>;
    return list
        .map((e) => DailyUsage.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<List<Map<String, dynamic>>> fetchInvoices() async {
    final list = await _client.get('/api/mobile/invoices') as List<dynamic>;
    return list.cast<Map<String, dynamic>>();
  }

  Future<void> disputeInvoice(String id, String note) async {
    await _client.post('/api/mobile/invoices/$id/dispute', {'note': note});
  }

  Future<void> requestPayment({
    required String billId,
    required double amount,
    required String reference,
  }) async {
    await _client.post('/api/mobile/payments', {
      'billId': billId,
      'amount': amount,
      'method': 'chappa',
      'reference': reference,
      'status': 'pending',
    });
  }

  Future<List<Map<String, dynamic>>> fetchMyJobs() async {
    final list = await _client.get('/api/field/work-orders') as List<dynamic>;
    return list.cast<Map<String, dynamic>>();
  }

  Future<void> actOnJob(String id, String action, [Map<String, dynamic>? body]) async {
    await _client.post('/api/field/work-orders/$id/$action', body ?? {});
  }

  Future<List<Bill>> fetchBills() async {
    final list = await _client.get('/api/mobile/bills') as List<dynamic>;
    return list.map((e) => Bill.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  Future<List<SupportTicket>> fetchTickets() async {
    final list =
        await _client.get('/api/mobile/support-tickets') as List<dynamic>;
    return list
        .map((e) => SupportTicket.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<SupportTicket> createTicket(
    String issue,
    String priority, {
    String type = 'Sensor Issue',
    String description = '',
  }) async {
    final json = await _client.post('/api/mobile/support-tickets', {
      'issue': issue,
      'priority': priority,
      'type': type,
      'description': description.isNotEmpty ? description : issue,
    });
    return SupportTicket.fromJson(Map<String, dynamic>.from(json as Map));
  }
}
