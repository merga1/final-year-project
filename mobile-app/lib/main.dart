import 'package:flutter/material.dart';

import 'core/api_client.dart';
import 'core/auth_service.dart';
import 'models/mobile_repository.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/usage_screen.dart';
import 'screens/bills_screen.dart';
import 'screens/support_screen.dart';
import 'screens/profile_screen.dart';

void main() {
  runApp(const SmartWaterApp());
}

class SmartWaterApp extends StatelessWidget {
  const SmartWaterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smart Water',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0D5C91)),
        useMaterial3: true,
      ),
      home: const AppRoot(),
    );
  }
}

class AppRoot extends StatefulWidget {
  const AppRoot({super.key});

  @override
  State<AppRoot> createState() => _AppRootState();
}

class _AppRootState extends State<AppRoot> {
  final _apiClient = ApiClient();
  late final AuthService _auth;
  late final MobileRepository _repo;
  bool _ready = false;
  bool _loggedIn = false;

  @override
  void initState() {
    super.initState();
    _auth = AuthService(_apiClient);
    _repo = MobileRepository(_apiClient);
    _tryRestore();
  }

  Future<void> _tryRestore() async {
    final restored = await _auth.tryRestoreSession();
    setState(() { _ready = true; _loggedIn = restored; });
  }

  void _onLogin() => setState(() => _loggedIn = true);
  void _onLogout() => setState(() => _loggedIn = false);

  @override
  Widget build(BuildContext context) {
    if (!_ready) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (!_loggedIn) {
      return LoginScreen(authService: _auth, onLogin: _onLogin);
    }

    return MainShell(repo: _repo, auth: _auth, onLogout: _onLogout);
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key, required this.repo, required this.auth, required this.onLogout});
  final MobileRepository repo;
  final AuthService auth;
  final VoidCallback onLogout;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(repo: widget.repo),
      UsageScreen(repo: widget.repo),
      BillsScreen(repo: widget.repo),
      SupportScreen(repo: widget.repo),
      ProfileScreen(authService: widget.auth, onLogout: widget.onLogout),
    ];

    const titles = ['Home', 'Usage', 'Bills', 'Support', 'Profile'];

    return Scaffold(
      appBar: AppBar(
        title: Text(titles[_index]),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.water_drop_outlined), selectedIcon: Icon(Icons.water_drop), label: 'Usage'),
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'Bills'),
          NavigationDestination(icon: Icon(Icons.support_agent_outlined), selectedIcon: Icon(Icons.support_agent), label: 'Support'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
