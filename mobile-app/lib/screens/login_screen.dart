import 'package:flutter/material.dart';
import '../core/auth_service.dart';
import '../core/constants.dart';
import '../widgets/aquasense_logo.dart';
import 'register_screen.dart';

/// Unified sign-in screen.
///
/// • No role selection before sign-in — the user just enters credentials and
///   the backend/app determine whether they are a customer, technician, or admin.
/// • Technicians always sign in here (they cannot self-register).
/// • Customers can tap "Sign up" to create an account.
/// • On a technician's very first login [mustChangePassword == true] a dialog
///   forces them to set a new password before proceeding.
class LoginScreen extends StatefulWidget {
  const LoginScreen({
    super.key,
    required this.authService,
    required this.onLogin,
  });

  final AuthService authService;

  /// Called once login (and any forced password change) is complete.
  final VoidCallback onLogin;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  String? _error;
  bool _obscure = true;
  bool _rememberMe = true;

  Future<void> _login() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await widget.authService.login(
        _emailController.text.trim(),
        _passwordController.text,
        rememberMe: _rememberMe,
      );

      // Check if technician must change password on first login.
      final user = await widget.authService.getStoredUser();
      if (user['role'] == 'admin') {
        await widget.authService.logout();
        setState(() {
          _error = 'Administrator accounts use the web dashboard.';
        });
        return;
      }
      final mustChange = user['mustChangePassword'] == 'true';
      if (mustChange && mounted) {
        await _showForceChangePassword();
        // After dialog, re-fetch to confirm flag is cleared.
        return;
      }

      widget.onLogin();
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  /// Shows a mandatory password-change dialog for technicians on first login.
  /// They cannot dismiss it without setting a new password.
  Future<void> _showForceChangePassword() async {
    final oldCtrl = TextEditingController(text: _passwordController.text);
    final newCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();
    bool obscureNew = true;
    String? dialogError;

    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.lock_reset_rounded, color: Color(0xFF1E6B52)),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Set your password',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Welcome! This is your first login.\n'
                  'Please set a new password to secure your account.',
                  style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 20),
                _dialogField(
                  controller: oldCtrl,
                  label: 'Current (temporary) password',
                  obscure: true,
                ),
                const SizedBox(height: 12),
                _dialogFieldObscureToggle(
                  controller: newCtrl,
                  label: 'New password',
                  obscure: obscureNew,
                  onToggle: () => setDialogState(() => obscureNew = !obscureNew),
                ),
                const SizedBox(height: 12),
                _dialogField(
                  controller: confirmCtrl,
                  label: 'Confirm new password',
                  obscure: true,
                ),
                if (dialogError != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFEDED),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      dialogError!,
                      style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13),
                    ),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF1E6B52),
              ),
              onPressed: () async {
                final oldPw = oldCtrl.text;
                final newPw = newCtrl.text;
                final confirmPw = confirmCtrl.text;
                if (newPw.length < 6) {
                  setDialogState(
                      () => dialogError = 'New password must be at least 6 characters.');
                  return;
                }
                if (newPw != confirmPw) {
                  setDialogState(() => dialogError = 'Passwords do not match.');
                  return;
                }
                if (newPw == oldPw) {
                  setDialogState(
                      () => dialogError = 'New password must be different from the current one.');
                  return;
                }
                try {
                  await widget.authService.changePassword(oldPw, newPw);
                  if (ctx.mounted) Navigator.pop(ctx);
                  widget.onLogin();
                } catch (e) {
                  setDialogState(() => dialogError =
                      e.toString().replaceFirst('Exception: ', ''));
                }
              },
              child: const Text('Save & Continue'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _dialogField({
    required TextEditingController controller,
    required String label,
    required bool obscure,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        isDense: true,
      ),
    );
  }

  Widget _dialogFieldObscureToggle({
    required TextEditingController controller,
    required String label,
    required bool obscure,
    required VoidCallback onToggle,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        isDense: true,
        suffixIcon: IconButton(
          icon: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
          onPressed: onToggle,
        ),
      ),
    );
  }

  Future<void> _showMeterRequestSubmitted() async {
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle_outline, color: Color(0xFF2E8B57)),
            SizedBox(width: 8),
            Expanded(child: Text('Meter request submitted')),
          ],
        ),
        content: const Text(
          'Your customer account has been created and your request is now with '
          'the administrator.\n\nOnce a water meter is approved and linked to '
          'your account, log in here with your email and password to open your '
          'customer dashboard.',
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Back to login'),
          ),
        ],
      ),
    );
  }

  Future<void> _forgotPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _error = 'Enter your email first, then choose Forgot Password.');
      return;
    }
    try {
      await widget.authService.forgotPassword(email);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('If the account exists, reset instructions will be sent shortly.')),
        );
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
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
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.dns_outlined, color: Colors.black54),
            tooltip: 'Server Settings',
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
              const SizedBox(height: 12),
              const Center(
                child: AquaSenseLogo(
                  iconSize: 68,
                  horizontal: false,
                  showSubtitle: true,
                ),
              ),
              const SizedBox(height: 28),
              const Text(
                'Sign In',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Enter your credentials to continue.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Colors.grey[600]),
              ),
              const SizedBox(height: 28),

              // Email input
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  hintText: 'Email',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
              ),
              const SizedBox(height: 16),

              // Password input
              TextField(
                controller: _passwordController,
                obscureText: _obscure,
                decoration: InputDecoration(
                  hintText: 'Password',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  suffixIcon: IconButton(
                    icon: Icon(_obscure
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
                onSubmitted: (_) => _login(),
              ),

              // Remember me & Forgot Password row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Checkbox(
                        value: _rememberMe,
                        onChanged: (v) => setState(() => _rememberMe = v ?? true),
                        activeColor: const Color(0xFF0284C7),
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      const Text(
                        'Remember me',
                        style: TextStyle(fontSize: 13, color: Color(0xFF334155)),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: _forgotPassword,
                    style: TextButton.styleFrom(
                      padding: EdgeInsets.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text(
                      'Forgot Password?',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF0284C7),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),

              // Error banner
              if (_error != null) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: cs.errorContainer,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _error!,
                        style: TextStyle(color: cs.onErrorContainer, fontSize: 13),
                      ),
                      if (_error!.contains('Connection refused') ||
                          _error!.contains('SocketConnection') ||
                          _error!.contains('SocketException')) ...[
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: [
                            OutlinedButton.icon(
                              onPressed: () async {
                                await ApiConstants.setBaseUrl(
                                    ApiConstants.defaultWifiUrl);
                                setState(() => _error = null);
                                _login();
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

              // Sign In button
              ElevatedButton(
                onPressed: _loading ? null : _login,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0284C7),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Sign In',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
              ),

              const SizedBox(height: 20),

              // Customer self-registration link.
              // Technicians are always created by an admin and cannot self-register.
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "Don't have an account? ",
                    style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                  ),
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => RegisterScreen(
                            authService: widget.authService,
                            onRegistered: () {
                              Navigator.pop(context);
                              widget.onLogin();
                            },
                            onMeterRequestSubmitted: () {
                              Navigator.pop(context);
                              _showMeterRequestSubmitted();
                            },
                          ),
                        ),
                      );
                    },
                    child: const Text(
                      'Sign up',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0284C7),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Hint for technicians
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.engineering_outlined,
                        size: 18, color: Color(0xFF1E6B52)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Technicians: use the credentials provided by your administrator.',
                        style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 48),

              // Footer
              Center(
                child: Column(
                  children: [
                    Text(
                      'Terms & Service',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '© 2025 AquaSense. All rights reserved.',
                      style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
