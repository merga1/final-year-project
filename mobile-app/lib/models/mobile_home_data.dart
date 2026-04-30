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
      title: json['title'] as String,
      value: json['value'] as String,
      subtitle: json['subtitle'] as String,
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
  });

  final String customerName;
  final String connectionStatus;
  final String meterId;
  final List<MobileStatusCardData> cards;
  final List<String> alerts;

  factory MobileHomeData.fromJson(Map<String, dynamic> json) {
    return MobileHomeData(
      customerName: json['customerName'] as String,
      connectionStatus: json['connectionStatus'] as String,
      meterId: json['meterId'] as String,
      cards: (json['cards'] as List<dynamic>)
          .map((card) => MobileStatusCardData.fromJson(card as Map<String, dynamic>))
          .toList(),
      alerts: (json['alerts'] as List<dynamic>).cast<String>(),
    );
  }
}
