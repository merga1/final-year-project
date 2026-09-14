import 'package:flutter/material.dart';
import '../core/auth_service.dart';
import '../core/constants.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.authService, required this.onLogin});
  final AuthService authService;
  final VoidCallback onLogin;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController(text: 'abel@customer.com');
  final _passwordController = TextEditingController(text: 'customer123');
  bool _loading = false;
  String? _error;
  bool _obscure = true;

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    try {
      await widget.authService.login(
        _emailController.text.trim(),
        _passwordController.text,
      );
      widget.onLogin();
    } catch (e) {
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openServerDialog() async {
    final customController = TextEditingController(text: ApiConstants.baseUrl);
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(children: [
          Icon(Icons.dns_outlined, color: Color(0xFF0D5C91)),
          SizedBox(width: 8),
          Text('Server Settings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ]),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Select your connection method:', style: TextStyle(fontSize: 13, color: Colors.grey)),
              const SizedBox(height: 12),
              ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.usb, color: Color(0xFF0D5C91)),
                title: const Text('USB Cable / ADB reverse'),
                subtitle: const Text(ApiConstants.defaultLocalUrl),
                onTap: () {
                  customController.text = ApiConstants.defaultLocalUrl;
                },
              ),
              ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.wifi, color: Color(0xFF2E8B57)),
                title: const Text('Wi-Fi Network (PC LAN)'),
                subtitle: const Text(ApiConstants.defaultWifiUrl),
                onTap: () {
                  customController.text = ApiConstants.defaultWifiUrl;
                },
              ),
              ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.phone_android, color: Colors.orange),
                title: const Text('Android Emulator'),
                subtitle: const Text(ApiConstants.defaultEmulatorUrl),
                onTap: () {
                  customController.text = ApiConstants.defaultEmulatorUrl;
                },
              ),
              const Divider(height: 24),
              TextField(
                controller: customController,
                decoration: const InputDecoration(
                  labelText: 'Custom Server URL',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.link),
                  isDense: true,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              final newUrl = customController.text.trim();
              if (newUrl.isNotEmpty) {
                await ApiConstants.setBaseUrl(newUrl);
                if (mounted) setState(() {});
              }
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: const Text('Apply'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.dns_outlined),
            tooltip: 'Server Connection Settings',
            onPressed: _openServerDialog,
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),
              const Icon(Icons.water_drop_rounded, size: 64, color: Color(0xFF0D5C91)),
              const SizedBox(height: 12),
              Text('Smart Water', textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('Sign in to your account', textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey[600])),
              const SizedBox(height: 32),
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email address',
                  prefixIcon: Icon(Icons.email_outlined), border: OutlineInputBorder()),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                obscureText: _obscure,
                decoration: InputDecoration(
                  labelText: 'Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
                onSubmitted: (_) => _login(),
              ),
              if (_error != null) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: cs.errorContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_error!, style: TextStyle(color: cs.onErrorContainer, fontSize: 13)),
                      const SizedBox(height: 8),
                      TextButton.icon(
                        style: TextButton.styleFrom(padding: EdgeInsets.zero),
                        icon: const Icon(Icons.settings, size: 16),
                        label: const Text('Change Server URL', style: TextStyle(fontSize: 13)),
                        onPressed: _openServerDialog,
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _loading ? null : _login,
                style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                child: _loading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Sign in', style: TextStyle(fontSize: 16)),
              ),
              const SizedBox(height: 16),
              Text('Demo: abel@customer.com / customer123',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: Colors.grey[500])),
              const SizedBox(height: 12),
              Center(
                child: ActionChip(
                  avatar: const Icon(Icons.link, size: 16, color: Color(0xFF0D5C91)),
                  label: Text(
                    'Server: ${ApiConstants.baseUrl}',
                    style: const TextStyle(fontSize: 11),
                  ),
                  onPressed: _openServerDialog,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
