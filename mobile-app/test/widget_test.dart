import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smart_water_mobile/main.dart';
import 'package:smart_water_mobile/screens/login_screen.dart';
import 'package:smart_water_mobile/screens/role_select_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('logged-out app asks the user to choose a portal', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const SmartWaterApp());
    await tester.pumpAndSettle();

    expect(find.byType(RoleSelectScreen), findsOneWidget);
    expect(find.text('Customer'), findsOneWidget);
    expect(find.text('Technician'), findsOneWidget);
  });

  testWidgets('choosing Customer opens the customer login', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const SmartWaterApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Customer'));
    await tester.pumpAndSettle();

    expect(find.byType(LoginScreen), findsOneWidget);
    expect(find.text('Customer Login'), findsOneWidget);
  });

  testWidgets('choosing Technician opens the technician login', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const SmartWaterApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Technician'));
    await tester.pumpAndSettle();

    expect(find.byType(LoginScreen), findsOneWidget);
    expect(find.text('Technician Login'), findsOneWidget);
    // Technicians cannot self-register.
    expect(find.text('Sign up'), findsNothing);
  });
}
