class TechnicianSummary {
  const TechnicianSummary({
    required this.assigned,
    required this.accepted,
    required this.resolved,
    this.inProgress = 0,
    this.total = 0,
    this.technicianName = 'Technician',
    this.email = '',
    this.phone = '',
    this.zone = 'Zone A',
    this.specialization = 'No specialization',
    this.dutyStatus = 'on_duty',
    this.currentJobCount = 0,
    this.completedRepairs = 0,
  });

  final int assigned;
  final int accepted;
  final int resolved;
  final int inProgress;
  final int total;
  final String technicianName;
  final String email;
  final String phone;
  final String zone;
  final String specialization;
  final String dutyStatus;
  final int currentJobCount;
  final int completedRepairs;

  factory TechnicianSummary.fromJson(Map<String, dynamic> json) =>
      TechnicianSummary(
        assigned: (json['assigned'] as num?)?.toInt() ?? 0,
        accepted: (json['accepted'] as num?)?.toInt() ?? 0,
        resolved: (json['resolved'] as num?)?.toInt() ?? 0,
        inProgress: (json['inProgress'] as num?)?.toInt() ?? 0,
        total: (json['total'] as num?)?.toInt() ?? 0,
        technicianName:
            json['technicianName']?.toString() ?? 'Technician',
        email: json['email']?.toString() ?? '',
        phone: json['phone']?.toString() ?? '',
        zone: json['zone']?.toString() ?? 'Zone A',
        specialization:
            json['specialization']?.toString() ?? 'No specialization',
        dutyStatus: json['dutyStatus']?.toString() ?? 'on_duty',
        currentJobCount: (json['currentJobCount'] as num?)?.toInt() ?? 0,
        completedRepairs: (json['completedRepairs'] as num?)?.toInt() ?? 0,
      );
}

class TechnicianTicket {
  const TechnicianTicket({
    required this.id,
    required this.type,
    required this.description,
    required this.status,
    required this.createdAt,
    this.customerName = 'Customer',
    this.customerAddress = '',
    this.priority = 'Medium',
    this.issue = '',
    this.notes = '',
    this.progressNotes = '',
    this.rejectionReason = '',
    this.assignedAt,
    this.acceptedAt,
    this.resolvedAt,
    this.updatedAt,
  });

  final String id;
  final String type;
  final String description;
  final String status;
  final String createdAt;
  final String customerName;
  final String customerAddress;
  final String priority;
  final String issue;
  final String notes;
  final String progressNotes;
  final String rejectionReason;
  final String? assignedAt;
  final String? acceptedAt;
  final String? resolvedAt;
  final String? updatedAt;

  factory TechnicianTicket.fromJson(Map<String, dynamic> json) =>
      TechnicianTicket(
        id: json['id']?.toString() ?? '',
        type: json['type']?.toString() ?? 'Support issue',
        description:
            json['description']?.toString() ?? json['issue']?.toString() ?? '',
        status: json['status']?.toString() ?? 'pending',
        createdAt: json['createdAt']?.toString() ?? '',
        customerName: json['customerName']?.toString() ?? 'Customer',
        customerAddress: json['customerAddress']?.toString() ?? '',
        priority: json['priority']?.toString() ?? 'Medium',
        issue: json['issue']?.toString() ?? '',
        notes: json['notes']?.toString() ?? '',
        progressNotes: json['progressNotes']?.toString() ?? '',
        rejectionReason: json['rejectionReason']?.toString() ?? '',
        assignedAt: json['assignedAt']?.toString(),
        acceptedAt: json['acceptedAt']?.toString(),
        resolvedAt: json['resolvedAt']?.toString(),
        updatedAt: json['updatedAt']?.toString(),
      );
}

class TechnicianDeviceSnapshot {
  const TechnicianDeviceSnapshot({
    required this.meterId,
    required this.flowRate,
    required this.turbidity,
    required this.valveState,
    required this.connectivity,
    this.alerts = const [],
    this.ticketType = '',
    this.priority = 'Medium',
    this.customerName = '',
    this.customerAddress = '',
    this.zone = '',
    this.batteryPercent,
    this.lastUpdatedAt,
  });

  final String meterId;
  final double flowRate;
  final double turbidity;
  final String valveState;
  final String connectivity;
  final List<dynamic> alerts;
  final String ticketType;
  final String priority;
  final String customerName;
  final String customerAddress;
  final String zone;
  final double? batteryPercent;
  final String? lastUpdatedAt;

  factory TechnicianDeviceSnapshot.fromJson(Map<String, dynamic> json) =>
      TechnicianDeviceSnapshot(
        meterId: json['meterId']?.toString() ?? 'Unknown device',
        flowRate: (json['flowRateLpm'] as num?)?.toDouble() ?? 0,
        turbidity: (json['turbidityNtu'] as num?)?.toDouble() ?? 0,
        valveState: json['valveState']?.toString() ?? 'UNKNOWN',
        connectivity: json['connectivity']?.toString() ?? 'UNKNOWN',
        alerts: json['alerts'] as List<dynamic>? ?? [],
        ticketType: json['ticketType']?.toString() ?? '',
        priority: json['priority']?.toString() ?? 'Medium',
        customerName: json['customerName']?.toString() ?? '',
        customerAddress: json['customerAddress']?.toString() ?? '',
        zone: json['zone']?.toString() ?? '',
        batteryPercent: (json['batteryPercent'] as num?)?.toDouble(),
        lastUpdatedAt: json['lastUpdatedAt']?.toString(),
      );
}

class TechnicianNotification {
  const TechnicianNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.createdAt,
    this.read = false,
  });

  final String id;
  final String title;
  final String message;
  final String createdAt;
  final bool read;

  factory TechnicianNotification.fromJson(Map<String, dynamic> json) =>
      TechnicianNotification(
        id: json['id']?.toString() ?? '',
        title: json['title']?.toString() ?? 'Notification',
        message: json['message']?.toString() ?? '',
        createdAt: json['createdAt']?.toString() ?? '',
        read: json['read'] as bool? ?? false,
      );
}
