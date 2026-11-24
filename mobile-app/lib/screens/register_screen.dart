import 'package:flutter/material.dart';

import '../core/auth_service.dart';
import '../core/constants.dart';
import '../widgets/aquasense_logo.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({
    super.key,
    required this.authService,
    required this.onRegistered,
  });

  final AuthService authService;

  /// Called when the customer account is created and the session is ready.
  final VoidCallback onRegistered;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _first.dispose();
    _last.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _createAccount() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await widget.authService.register(
        firstName: _first.text,
        lastName: _last.text,
        email: _email.text,
        password: _password.text,
      );
      widget.onRegistered();
    } catch (error) {
      if (mounted) {
        setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openServerDialog() async {
    final customController = TextEditingController(text: ApiConstants.baseUrl);
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.dns_outlined, color: Color(0xFF1E6B52)),
            SizedBox(width: 8),
            Text(
              'Server Settings',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Select your connection method:',
                style: TextStyle(fontSize: 13, color: Colors.grey),
              ),
              const SizedBox(height: 12),
              ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.cloud, color: Color(0xFF0284C7)),
                title: const Text('Cloud Server (Vercel Production)'),
                subtitle: const Text(ApiConstants.defaultCloudUrl),
                onTap: () {
                  customController.text = ApiConstants.defaultCloudUrl;
                },
              ),
              ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.wifi, color: Color(0xFF1E6B52)),
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
  Widget build(BuildContext context) {
    final isConnectionError = _error != null &&
        (_error!.contains('Connection refused') ||
            _error!.contains('SocketException') ||
            _error!.contains('ClientException') ||
            _error!.contains('timed out') ||
            _error!.contains('Failed to connect'));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create account'),
        actions: [
          IconButton(
            icon: const Icon(Icons.dns_outlined),
            tooltip: 'Server Settings',
            onPressed: _openServerDialog,
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const Center(
                child: AquaSenseLogo(
                    iconSize: 54, horizontal: false, showSubtitle: true)),
            const SizedBox(height: 24),
            const Text('Sign up as a customer',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            const Text(
              'Create your account and sign in right away. A water meter can be linked later by an administrator.',
            ),
            const SizedBox(height: 20),
            Row(children: [
              Expanded(child: _field(_first, 'First name')),
              const SizedBox(width: 12),
              Expanded(child: _field(_last, 'Last name')),
            ]),
            const SizedBox(height: 12),
            _field(_email, 'Email', keyboard: TextInputType.emailAddress),
            const SizedBox(height: 12),
            _field(_password, 'Password', obscure: true),
            if (_error != null) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFEBEB),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFCA5A5)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      _error!,
                      style: const TextStyle(
                        color: Color(0xFFDC2626),
                        fontSize: 13,
                        height: 1.3,
                      ),
                    ),
                    if (isConnectionError) ...[
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: [
                          OutlinedButton.icon(
                            onPressed: () async {
                              await ApiConstants.setBaseUrl(
                                  ApiConstants.defaultCloudUrl);
                              setState(() => _error = null);
                              _createAccount();
                            },
                            icon: const Icon(Icons.cloud_done, size: 16),
                            label: const Text('Use Cloud Server',
                                style: TextStyle(fontSize: 12)),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF0284C7),
                              side: const BorderSide(color: Color(0xFF0284C7)),
                              visualDensity: VisualDensity.compact,
                            ),
                          ),
                          OutlinedButton.icon(
                            onPressed: () async {
                              await ApiConstants.setBaseUrl(
                                  ApiConstants.defaultWifiUrl);
                              setState(() => _error = null);
                              _createAccount();
                            },
                            icon: const Icon(Icons.wifi, size: 16),
                            label: const Text('Use Wi-Fi',
                                style: TextStyle(fontSize: 12)),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF1E6B52),
                              side: const BorderSide(color: Color(0xFF1E6B52)),
                              visualDensity: VisualDensity.compact,
                            ),
                          ),
                          OutlinedButton.icon(
                            onPressed: _openServerDialog,
                            icon: const Icon(Icons.settings, size: 16),
                            label: const Text('Change Server IP',
                                style: TextStyle(fontSize: 12)),
                            style: OutlinedButton.styleFrom(
                              visualDensity: VisualDensity.compact,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _loading ? null : _createAccount,
              child: _loading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Create account'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    bool obscure = false,
    TextInputType? keyboard,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboard,
      decoration:
          InputDecoration(labelText: label, border: const OutlineInputBorder()),
      validator: (value) {
        if (value == null || value.trim().isEmpty) return 'Required';
        if (label == 'Email' && !value.contains('@')) {
          return 'Enter a valid email';
        }
        if (label == 'Password' && value.length < 6) {
          return 'Use at least 6 characters';
        }
        return null;
      },
    );
  }
}
