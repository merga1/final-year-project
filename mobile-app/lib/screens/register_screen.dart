import 'package:flutter/material.dart';
import '../core/auth_service.dart';
import '../widgets/aquasense_logo.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key, required this.authService, required this.onRegistered});
  final AuthService authService;
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
  final _address = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _first.dispose();
    _last.dispose();
    _email.dispose();
    _password.dispose();
    _address.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() { _loading = true; _error = null; });
    try {
      await widget.authService.register(
        firstName: _first.text,
        lastName: _last.text,
        email: _email.text,
        password: _password.text,
        address: _address.text.trim(),
      );
      widget.onRegistered();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create account')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const Center(child: AquaSenseLogo(iconSize: 54, horizontal: false, showSubtitle: true)),
            const SizedBox(height: 24),
            const Text('Sign up as a customer', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            const Text('Create your AquaSense account to monitor your water service.'),
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
            const SizedBox(height: 12),
            _field(_address, 'Address', requiredField: false),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _loading ? null : _submit,
              child: _loading ? const CircularProgressIndicator() : const Text('Create account'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _field(TextEditingController controller, String label, {bool obscure = false, bool requiredField = true, TextInputType? keyboard}) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboard,
      decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
      validator: (value) {
        if (!requiredField && (value == null || value.isEmpty)) return null;
        if (value == null || value.trim().isEmpty) return 'Required';
        if (label == 'Email' && !value.contains('@')) return 'Enter a valid email';
        if (label == 'Password' && value.length < 6) return 'Use at least 6 characters';
        return null;
      },
    );
  }
}
