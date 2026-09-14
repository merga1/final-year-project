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
      connectionStatus: 'ONLINE',
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

  @override
  Future<List<DailyUsage>> fetchDailyUsage() async => [];

  @override
  Future<List<Bill>> fetchBills() async => [];

  @override
  Future<List<SupportTicket>> fetchTickets() async => [];

  @override
  Future<SupportTicket> createTicket(String issue, String priority) async {
    return SupportTicket(
      id: 'mock-1',
      issue: issue,
      priority: priority,
      status: 'open',
      createdAt: '2026-09-14T10:00:00Z',
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
  Future<List<DailyUsage>> fetchDailyUsage() async => [];

  @override
  Future<List<Bill>> fetchBills() async => [];

  @override
  Future<List<SupportTicket>> fetchTickets() async => [];

  @override
  Future<SupportTicket> createTicket(String issue, String priority) async {
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

    expect(find.text('Welcome, Abel Tesfaye'), findsOneWidget);
    expect(find.text('Meter ESP32-001 • ONLINE'), findsOneWidget);
    expect(find.text('Water Quality'), findsOneWidget);
    expect(find.text('Current Usage'), findsOneWidget);
    expect(find.byType(Card), findsWidgets);
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
