import 'package:flutter/material.dart';

import '../core/auth_service.dart';
import '../core/constants.dart';
import '../widgets/aquasense_logo.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({
    super.key,
    required this.authService,
    required this.onRegistered,
    required this.onMeterRequestSubmitted,
  });

  final AuthService authService;

  /// Called when the customer created an account with a meter number and can
  /// go straight to the customer dashboard.
  final VoidCallback onRegistered;

  /// Called after a customer without a meter submits the meter request.
  final VoidCallback onMeterRequestSubmitted;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _meterId = TextEditingController();
  final _address = TextEditingController();
  final _phone = TextEditingController();
  final _requestDetails = TextEditingController();
  bool? _hasMeter;
  bool _requestMode = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _first.dispose();
    _last.dispose();
    _email.dispose();
    _password.dispose();
    _meterId.dispose();
    _address.dispose();
    _phone.dispose();
    _requestDetails.dispose();
    super.dispose();
  }

  Future<void> _createAccount() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_hasMeter == null) {
      setState(() => _error = 'Choose whether you already have a water meter.');
      return;
    }

    // A customer without a meter does not get an account yet. The account is
    // created together with the meter request in step 2, so abandoning the
    // request never leaves an unusable half-registered account behind.
    if (_hasMeter == false) {
      setState(() {
        _requestMode = true;
        _error = null;
      });
      return;
    }

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
        address: _address.text.trim(),
        meterId: _meterId.text.trim(),
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

  Future<void> _submitMeterRequest() async {
    if (_address.text.trim().isEmpty) {
      setState(() => _error = 'Enter the address where the meter should be installed.');
      return;
    }
    if (_phone.text.trim().isEmpty) {
      setState(() => _error = 'Enter a phone number the water team can contact.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await widget.authService.registerMeterRequest(
        firstName: _first.text,
        lastName: _last.text,
        email: _email.text,
        password: _password.text,
        address: _address.text,
        phone: _phone.text,
        details: _requestDetails.text,
      );
      if (mounted) widget.onMeterRequestSubmitted();
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
        title: Text(_requestMode ? 'Request a water meter' : 'Create account'),
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
            if (_requestMode) ..._meterRequestFields(context) else ..._accountFields(),
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
                              await ApiConstants.setBaseUrl(ApiConstants.defaultCloudUrl);
                              setState(() => _error = null);
                              if (_requestMode) {
                                _submitMeterRequest();
                              } else {
                                _createAccount();
                              }
                            },
                            icon: const Icon(Icons.cloud_done, size: 16),
                            label: const Text('Use Cloud Server', style: TextStyle(fontSize: 12)),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF0284C7),
                              side: const BorderSide(color: Color(0xFF0284C7)),
                              visualDensity: VisualDensity.compact,
                            ),
                          ),
                          OutlinedButton.icon(
                            onPressed: () async {
                              await ApiConstants.setBaseUrl(ApiConstants.defaultWifiUrl);
                              setState(() => _error = null);
                              if (_requestMode) {
                                _submitMeterRequest();
                              } else {
                                _createAccount();
                              }
                            },
                            icon: const Icon(Icons.wifi, size: 16),
                            label: const Text('Use Wi-Fi', style: TextStyle(fontSize: 12)),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF1E6B52),
                              side: const BorderSide(color: Color(0xFF1E6B52)),
                              visualDensity: VisualDensity.compact,
                            ),
                          ),
                          OutlinedButton.icon(
                            onPressed: _openServerDialog,
                            icon: const Icon(Icons.settings, size: 16),
                            label: const Text('Change Server IP', style: TextStyle(fontSize: 12)),
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
              onPressed: _loading
                  ? null
                  : (_requestMode ? _submitMeterRequest : _createAccount),
              child: _loading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(_requestMode
                      ? 'Submit meter request'
                      : _hasMeter == false
                          ? 'Continue to meter request'
                          : 'Create account'),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _accountFields() => [
        const Text('Sign up as a customer',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        const Text(
            'Create your customer account. If you already have a water meter number, we will link it and open your dashboard immediately.'),
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
        const SizedBox(height: 20),
        const Text('Do you already have a water meter?',
            style: TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        _meterChoice(
          value: true,
          title: 'Yes, I have a meter number',
          subtitle: 'Link the meter to this customer account.',
        ),
        const SizedBox(height: 8),
        _meterChoice(
          value: false,
          title: 'No, I need a water meter',
          subtitle:
              'Create the account, then send a request to the administrator.',
        ),
        if (_hasMeter == true) ...[
          const SizedBox(height: 12),
          _field(_meterId, 'Water meter number', keyboard: TextInputType.text),
          const SizedBox(height: 12),
          _field(_address, 'Service address', requiredField: false),
        ],
      ];

  List<Widget> _meterRequestFields(BuildContext context) => [
        const Text('Request a water meter',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        const Text(
            'Step 2 of 2 — send your installation details to the administrator. After the meter is approved you can log in with your email and password.'),
        const SizedBox(height: 20),
        _field(_address, 'Installation address'),
        const SizedBox(height: 12),
        _field(_phone, 'Contact phone', keyboard: TextInputType.phone),
        const SizedBox(height: 12),
        TextFormField(
          controller: _requestDetails,
          minLines: 3,
          maxLines: 5,
          decoration: const InputDecoration(
            labelText: 'Additional details (optional)',
            border: OutlineInputBorder(),
            alignLabelWithHint: true,
          ),
        ),
      ];

  Widget _meterChoice({
    required bool value,
    required String title,
    required String subtitle,
  }) {
    final selected = _hasMeter == value;
    return InkWell(
      onTap: () => setState(() {
        _hasMeter = value;
        _error = null;
      }),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFE0F2FE) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: selected
                  ? const Color(0xFF0284C7)
                  : const Color(0xFFCBD5E1)),
        ),
        child: Row(
          children: [
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: selected ? const Color(0xFF0284C7) : Colors.blueGrey,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 3),
                  Text(subtitle,
                      style: const TextStyle(
                          fontSize: 12, color: Color(0xFF64748B))),
                ],
              ),
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
    bool requiredField = true,
    TextInputType? keyboard,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboard,
      decoration:
          InputDecoration(labelText: label, border: const OutlineInputBorder()),
      validator: (value) {
        if (label == 'Water meter number' && _hasMeter != true) return null;
        if (label == 'Service address' && _hasMeter != true) return null;
        if (!requiredField && (value == null || value.isEmpty)) return null;
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
