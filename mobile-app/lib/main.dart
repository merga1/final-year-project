import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'core/constants.dart';
import 'core/api_client.dart';
import 'core/auth_service.dart';
import 'models/mobile_repository.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/bills_screen.dart';
import 'screens/support_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/notifications_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiConstants.init();
  runApp(const SmartWaterApp());
}

class SmartWaterApp extends StatelessWidget {
  const SmartWaterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AquaSense',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0284C7),
          primary: const Color(0xFF0284C7),
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0284C7),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
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
    setState(() {
      _ready = true;
      _loggedIn = restored;
    });
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
  const MainShell({
    super.key,
    required this.repo,
    required this.auth,
    required this.onLogout,
  });

  final MobileRepository repo;
  final AuthService auth;
  final VoidCallback onLogout;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;
  String _userId = '7ebb0d261llb24dc88afb564400f8f5cc-289317';

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    try {
      final home = await widget.repo.fetchHome();
      if (mounted && home.userId.isNotEmpty) {
        setState(() => _userId = home.userId);
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(repo: widget.repo),
      BillsScreen(repo: widget.repo),
      SupportScreen(repo: widget.repo),
    ];

    const titles = ['Water Dashboard', 'Water Bill', 'Support Tickets'];

    return Scaffold(
      appBar: AppBar(
        title: Text(
          titles[_index],
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        ),
        centerTitle: true,
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(Icons.menu_rounded),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => NotificationsScreen(repo: widget.repo),
                ),
              );
            },
          ),
        ],
      ),
      drawer: _buildDrawer(context),
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        backgroundColor: Colors.white,
        elevation: 4,
        indicatorColor: const Color(0xFFE0F2FE),
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.grid_view_rounded),
            selectedIcon: Icon(Icons.grid_view_rounded, color: Color(0xFF0284C7)),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long_rounded, color: Color(0xFF0284C7)),
            label: 'Billing',
          ),
          NavigationDestination(
            icon: Icon(Icons.support_agent_outlined),
            selectedIcon: Icon(Icons.support_agent_rounded, color: Color(0xFF0284C7)),
            label: 'Support Ticket',
          ),
        ],
      ),
    );
  }

  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      child: Column(
        children: [
          // Drawer Header matching Page 7 right screenshot
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 50, 20, 24),
            color: const Color(0xFF0284C7),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Menu',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          _userId,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: _userId));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('User ID copied to clipboard')),
                          );
                        },
                        child: const Icon(Icons.copy_rounded, size: 16, color: Colors.white70),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Menu list items
          ListTile(
            leading: const Icon(Icons.person_outline_rounded, color: Color(0xFF334155)),
            title: const Text('Profile', style: TextStyle(fontWeight: FontWeight.w600)),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => Scaffold(
                    appBar: AppBar(title: const Text('Profile')),
                    body: ProfileScreen(
                      authService: widget.auth,
                      onLogout: widget.onLogout,
                    ),
                  ),
                ),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.shield_outlined, color: Color(0xFF334155)),
            title: const Text('Privacy Policy', style: TextStyle(fontWeight: FontWeight.w600)),
            onTap: () {
              Navigator.pop(context);
              _showInfoDialog(context, 'Privacy Policy',
                  'AquaSense values your privacy. Sensor measurements and billing data are encrypted in transit and at rest.');
            },
          ),
          ListTile(
            leading: const Icon(Icons.info_outline_rounded, color: Color(0xFF334155)),
            title: const Text('About', style: TextStyle(fontWeight: FontWeight.w600)),
            onTap: () {
              Navigator.pop(context);
              _showInfoDialog(context, 'About AquaSense',
                  'AquaSense Smart Water Monitoring v1.0.0\nIoT water conservation and leak prevention platform.');
            },
          ),
          ListTile(
            leading: const Icon(Icons.dns_outlined, color: Color(0xFF334155)),
            title: const Text('Server Connection', style: TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text(ApiConstants.baseUrl, style: const TextStyle(fontSize: 11, color: Colors.grey)),
            onTap: () {
              Navigator.pop(context);
              _openServerDialog(context);
            },
          ),
          const Spacer(),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout_rounded, color: Color(0xFFDC2626)),
            title: const Text(
              'Sign Out',
              style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFDC2626)),
            ),
            onTap: () {
              Navigator.pop(context);
              widget.onLogout();
            },
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  void _showInfoDialog(BuildContext context, String title, String body) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        content: Text(body),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _openServerDialog(BuildContext context) {
    final controller = TextEditingController(text: ApiConstants.baseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Server Connection', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Backend Server URL:', style: TextStyle(fontSize: 13, color: Colors.grey)),
            const SizedBox(height: 8),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'http://192.168.11.137:4000',
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: [
                ActionChip(
                  avatar: const Icon(Icons.wifi, size: 16),
                  label: const Text('Wi-Fi (192.168.11.137)', style: TextStyle(fontSize: 11)),
                  onPressed: () => controller.text = ApiConstants.defaultWifiUrl,
                ),
                ActionChip(
                  avatar: const Icon(Icons.usb, size: 16),
                  label: const Text('USB (127.0.0.1)', style: TextStyle(fontSize: 11)),
                  onPressed: () => controller.text = ApiConstants.defaultLocalUrl,
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              await ApiConstants.setBaseUrl(controller.text.trim());
              if (context.mounted) {
                Navigator.pop(ctx);
                setState(() {});
              }
            },
            child: const Text('Save & Apply'),
          ),
        ],
      ),
    );
  }
}
