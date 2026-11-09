import 'package:flutter/material.dart';

import '../core/auth_service.dart';
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_requestMode ? 'Request a water meter' : 'Create account'),
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
              const SizedBox(height: 12),
              Text(_error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error)),
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
