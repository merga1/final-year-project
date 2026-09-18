enum StatusTone {
  success,
  info,
  warning,
  danger,
}

class MobileStatusCardData {
  const MobileStatusCardData({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.tone,
  });

  final String title;
  final String value;
  final String subtitle;
  final StatusTone tone;

  factory MobileStatusCardData.fromJson(Map<String, dynamic> json) {
    return MobileStatusCardData(
      title: json['title'] as String? ?? '',
      value: json['value'] as String? ?? 'N/A',
      subtitle: json['subtitle'] as String? ?? '',
      tone: switch (json['tone']) {
        'success' => StatusTone.success,
        'warning' => StatusTone.warning,
        'danger' => StatusTone.danger,
        _ => StatusTone.info,
      },
    );
  }
}

class MobileHomeData {
  const MobileHomeData({
    required this.customerName,
    required this.connectionStatus,
    required this.meterId,
    required this.cards,
    required this.alerts,
    this.customerEmail = '',
    this.userId = '',
    this.flowRateLpm = 0.0,
    this.turbidityNtu = 0.0,
    this.monthlyConsumptionLiters = 1002.0,
    this.valveState = 'OPEN',
  });

  final String customerName;
  final String customerEmail;
  final String userId;
  final String connectionStatus;
  final String meterId;
  final double flowRateLpm;
  final double turbidityNtu;
  final double monthlyConsumptionLiters;
  final String valveState;
  final List<MobileStatusCardData> cards;
  final List<String> alerts;

  factory MobileHomeData.fromJson(Map<String, dynamic> json) {
    return MobileHomeData(
      customerName: json['customerName'] as String? ?? 'Customer',
      customerEmail: json['customerEmail'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      connectionStatus: json['connectionStatus'] as String? ?? 'ONLINE',
      meterId: json['meterId'] as String? ?? 'Not assigned',
      flowRateLpm: (json['flowRateLpm'] as num?)?.toDouble() ?? 0.0,
      turbidityNtu: (json['turbidityNtu'] as num?)?.toDouble() ?? 0.0,
      monthlyConsumptionLiters:
          (json['monthlyConsumptionLiters'] as num?)?.toDouble() ?? 1002.0,
      valveState: json['valveState'] as String? ?? 'OPEN',
      cards: ((json['cards'] as List<dynamic>?) ?? [])
          .map((card) =>
              MobileStatusCardData.fromJson(card as Map<String, dynamic>))
          .toList(),
      alerts: ((json['alerts'] as List<dynamic>?) ?? []).cast<String>(),
    );
  }
}
