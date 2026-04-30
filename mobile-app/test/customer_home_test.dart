import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_water_mobile/main.dart';
import 'package:smart_water_mobile/models/mobile_home_data.dart';
import 'package:smart_water_mobile/services/home_repository.dart';

class FakeHomeRepository implements HomeRepository {
  @override
  Future<MobileHomeData> fetchHomeDashboard() async {
    return const MobileHomeData(
      customerName: 'Abel Tesfaye',
      connectionStatus: 'Online',
      meterId: 'ESP32-001',
      cards: [
        MobileStatusCardData(
          title: 'Water Quality',
          value: 'Safe',
          subtitle: 'Turbidity: 2.1 NTU',
          tone: StatusTone.success,
        ),
        MobileStatusCardData(
          title: 'Current Usage',
          value: '12.4 L/min',
          subtitle: 'Today: 148 L',
          tone: StatusTone.info,
        ),
      ],
      alerts: ['Next bill due in 5 days.'],
    );
  }
}

class DelayedHomeRepository implements HomeRepository {
  @override
  Future<MobileHomeData> fetchHomeDashboard() async {
    await Future<void>.delayed(const Duration(milliseconds: 100));
    return const MobileHomeData(
      customerName: 'Abel Tesfaye',
      connectionStatus: 'Online',
      meterId: 'ESP32-001',
      cards: [],
      alerts: [],
    );
  }
}

void main() {
  testWidgets('renders backend-driven home data', (tester) async {
    await tester.pumpWidget(
      SmartWaterApp(
        repository: FakeHomeRepository(),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Welcome, Abel Tesfaye'), findsOneWidget);
    expect(find.text('Meter ESP32-001 • Online'), findsOneWidget);
    expect(find.text('Water Quality'), findsOneWidget);
    expect(find.text('Current Usage'), findsOneWidget);
    expect(find.byType(Card), findsWidgets);
  });

  testWidgets('shows loading indicator before data arrives', (tester) async {
    await tester.pumpWidget(
      SmartWaterApp(
        repository: DelayedHomeRepository(),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
