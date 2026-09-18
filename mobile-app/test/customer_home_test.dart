import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_water_mobile/models/mobile_home_data.dart';
import 'package:smart_water_mobile/models/mobile_repository.dart';
import 'package:smart_water_mobile/screens/home_screen.dart';

class FakeMobileRepository implements MobileRepository {
  @override
  Future<MobileHomeData> fetchHome() async {
    return const MobileHomeData(
      customerName: 'Abel Tesfaye',
      customerEmail: 'abel@customer.com',
      userId: 'mock-user-1',
      connectionStatus: 'ONLINE',
      meterId: 'ESP32-001',
      flowRateLpm: 12.4,
      turbidityNtu: 2.1,
      monthlyConsumptionLiters: 148.0,
      valveState: 'OPEN',
      cards: [],
      alerts: ['Next bill due in 5 days.'],
    );
  }

  @override
  Future<Map<String, dynamic>> toggleValve([String? nextState]) async => {
        'success': true,
        'valveState': nextState ?? 'CLOSED',
      };

  @override
  Future<List<DailyUsage>> fetchDailyUsage() async => [];

  @override
  Future<List<Bill>> fetchBills() async => [];

  @override
  Future<List<SupportTicket>> fetchTickets() async => [];

  @override
  Future<SupportTicket> createTicket(
    String issue,
    String priority, {
    String type = 'Sensor Issue',
    String description = '',
  }) async {
    return SupportTicket(
      id: 'mock-1',
      issue: issue,
      priority: priority,
      status: 'open',
      createdAt: '2026-09-14T10:00:00Z',
      type: type,
      description: description,
    );
  }
}

class DelayedMobileRepository implements MobileRepository {
  @override
  Future<MobileHomeData> fetchHome() async {
    await Future<void>.delayed(const Duration(milliseconds: 100));
    return const MobileHomeData(
      customerName: 'Abel Tesfaye',
      connectionStatus: 'ONLINE',
      meterId: 'ESP32-001',
      cards: [],
      alerts: [],
    );
  }

  @override
  Future<Map<String, dynamic>> toggleValve([String? nextState]) async => {
        'success': true,
        'valveState': nextState ?? 'CLOSED',
      };

  @override
  Future<List<DailyUsage>> fetchDailyUsage() async => [];

  @override
  Future<List<Bill>> fetchBills() async => [];

  @override
  Future<List<SupportTicket>> fetchTickets() async => [];

  @override
  Future<SupportTicket> createTicket(
    String issue,
    String priority, {
    String type = 'Sensor Issue',
    String description = '',
  }) async {
    throw UnimplementedError();
  }
}

void main() {
  testWidgets('renders backend-driven home data', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: HomeScreen(repo: FakeMobileRepository()),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Connecting to sensor data...'), findsOneWidget);
    expect(find.text('Flow Rate'), findsOneWidget);
    expect(find.text('Turbidity Level'), findsOneWidget);
    expect(find.text('Monthly Consumption'), findsOneWidget);
    expect(find.text('Valve Control'), findsOneWidget);
    expect(find.text('12.4'), findsOneWidget);
    expect(find.text('2.1'), findsOneWidget);
  });

  testWidgets('shows loading indicator before data arrives', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: HomeScreen(repo: DelayedMobileRepository()),
        ),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    await tester.pumpAndSettle();
  });
}
