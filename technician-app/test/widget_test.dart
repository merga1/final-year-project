// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:smart_water_technician/core/api_client.dart';
import 'package:smart_water_technician/core/auth_service.dart';
import 'package:smart_water_technician/main.dart';

void main() {
  testWidgets('technician login screen renders', (WidgetTester tester) async {
    final auth = TechnicianAuthService(TechnicianApiClient());

    await tester.pumpWidget(
      MaterialApp(
        home: TechnicianLogin(auth: auth, onLogin: () {}),
      ),
    );

    expect(find.text('AquaSense Technician'), findsOneWidget);
    expect(find.text('Sign in'), findsOneWidget);
  });
}
