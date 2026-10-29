class TechnicianSummary {
  const TechnicianSummary({required this.assigned, required this.accepted, required this.resolved});
  final int assigned;
  final int accepted;
  final int resolved;

  factory TechnicianSummary.fromJson(Map<String, dynamic> json) => TechnicianSummary(
        assigned: (json['assigned'] as num?)?.toInt() ?? 0,
        accepted: (json['accepted'] as num?)?.toInt() ?? 0,
        resolved: (json['resolved'] as num?)?.toInt() ?? 0,
      );
}

class TechnicianTicket {
  const TechnicianTicket({required this.id, required this.type, required this.description, required this.status, required this.createdAt, this.customerName = 'Customer', this.customerAddress = '', this.technicianName, this.notes, this.rejectionReason});
  final String id;
  final String type;
  final String description;
  final String status;
  final String createdAt;
  final String customerName;
  final String customerAddress;
  final String? technicianName;
  final String? notes;
  final String? rejectionReason;

  factory TechnicianTicket.fromJson(Map<String, dynamic> json) => TechnicianTicket(
        id: json['id']?.toString() ?? '',
        type: json['type']?.toString() ?? 'Support issue',
        description: json['description']?.toString() ?? json['issue']?.toString() ?? '',
        status: json['status']?.toString() ?? 'pending',
        createdAt: json['createdAt']?.toString() ?? '',
        customerName: json['customerName']?.toString() ?? 'Customer',
        customerAddress: json['customerAddress']?.toString() ?? '',
        technicianName: json['technicianName']?.toString(),
        notes: json['notes']?.toString(),
        rejectionReason: json['rejectionReason']?.toString(),
      );
}

class DeviceSnapshot {
  const DeviceSnapshot({required this.meterId, required this.flowRate, required this.turbidity, required this.valveState, required this.connectivity, this.lastUpdatedAt, this.alerts = const []});
  final String meterId;
  final double flowRate;
  final double turbidity;
  final String valveState;
  final String connectivity;
  final String? lastUpdatedAt;
  final List<dynamic> alerts;

  factory DeviceSnapshot.fromJson(Map<String, dynamic> json) => DeviceSnapshot(
        meterId: json['meterId']?.toString() ?? 'Unknown device',
        flowRate: (json['flowRateLpm'] as num?)?.toDouble() ?? 0,
        turbidity: (json['turbidityNtu'] as num?)?.toDouble() ?? 0,
        valveState: json['valveState']?.toString() ?? 'UNKNOWN',
        connectivity: json['connectivity']?.toString() ?? 'UNKNOWN',
        lastUpdatedAt: json['lastUpdatedAt']?.toString(),
        alerts: json['alerts'] as List<dynamic>? ?? [],
      );
}

class TechnicianNotification {
  const TechnicianNotification({required this.id, required this.title, required this.message, required this.createdAt, this.read = false});
  final String id;
  final String title;
  final String message;
  final String createdAt;
  final bool read;

  factory TechnicianNotification.fromJson(Map<String, dynamic> json) => TechnicianNotification(
        id: json['id']?.toString() ?? '',
        title: json['title']?.toString() ?? 'Notification',
        message: json['message']?.toString() ?? '',
        createdAt: json['createdAt']?.toString() ?? '',
        read: json['read'] as bool? ?? false,
      );
}
