import '../core/api_client.dart';
import 'mobile_home_data.dart';

class Bill {
  const Bill({
    required this.id, required this.periodStart, required this.periodEnd,
    required this.usageLiters, required this.amountEtb, required this.status,
    required this.dueDate,
  });

  final String id;
  final String periodStart;
  final String periodEnd;
  final double usageLiters;
  final double amountEtb;
  final String status;
  final String dueDate;

  factory Bill.fromJson(Map<String, dynamic> j) => Bill(
    id: j['id'] as String,
    periodStart: j['periodStart'] as String,
    periodEnd: j['periodEnd'] as String,
    usageLiters: (j['usageLiters'] as num).toDouble(),
    amountEtb: (j['amountEtb'] as num).toDouble(),
    status: j['status'] as String,
    dueDate: j['dueDate'] as String,
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
    required this.id, required this.issue, required this.priority,
    required this.status, required this.createdAt,
  });

  final String id;
  final String issue;
  final String priority;
  final String status;
  final String createdAt;

  factory SupportTicket.fromJson(Map<String, dynamic> j) => SupportTicket(
    id: j['id'] as String,
    issue: j['issue'] as String,
    priority: j['priority'] as String,
    status: j['status'] as String,
    createdAt: j['createdAt'] as String,
  );
}

class MobileRepository {
  MobileRepository(this._client);
  final ApiClient _client;

  Future<MobileHomeData> fetchHome() async {
    final json = await _client.get('/api/mobile/home');
    return MobileHomeData.fromJson(json as Map<String, dynamic>);
  }

  Future<List<DailyUsage>> fetchDailyUsage() async {
    final list = await _client.get('/api/mobile/readings/daily') as List<dynamic>;
    return list.map((e) => DailyUsage.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Bill>> fetchBills() async {
    final list = await _client.get('/api/mobile/bills') as List<dynamic>;
    return list.map((e) => Bill.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<SupportTicket>> fetchTickets() async {
    final list = await _client.get('/api/mobile/support-tickets') as List<dynamic>;
    return list.map((e) => SupportTicket.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<SupportTicket> createTicket(String issue, String priority) async {
    final json = await _client.post('/api/mobile/support-tickets', {
      'issue': issue,
      'priority': priority,
    });
    return SupportTicket.fromJson(json as Map<String, dynamic>);
  }
}
