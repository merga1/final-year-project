import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/auth_service.dart';
import '../models/mobile_home_data.dart';
import '../models/mobile_repository.dart';
import 'notifications_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({
    super.key,
    required this.authService,
    required this.onLogout,
    this.repo,
  });

  final AuthService authService;
  final VoidCallback onLogout;
  final MobileRepository? repo;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileData {
  const _ProfileData(this.user, this.home);

  final Map<String, String> user;
  final MobileHomeData? home;
}

class _ProfileScreenState extends State<ProfileScreen> {
  late Future<_ProfileData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_ProfileData> _load() async {
    final user = await widget.authService.getStoredUser();
    MobileHomeData? home;
    if (widget.repo != null) {
      try {
        home = await widget.repo!.fetchHome();
      } catch (_) {
        // Profile still renders from the cached session when the API is down.
      }
    }
    return _ProfileData(user, home);
  }

  Future<void> _refresh() async {
    setState(() => _future = _load());
    await _future;
  }

  void _copy(BuildContext context, String value, String label) {
    if (value.isEmpty) return;
    Clipboard.setData(ClipboardData(text: value));
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text('$label copied')));
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_ProfileData>(
      future: _future,
      builder: (ctx, snap) {
        final data = snap.data;
        final user = data?.user ?? const <String, String>{};
        final home = data?.home;
        final name = home != null && home.customerName.isNotEmpty
            ? home.customerName
            : (user['name'] ?? 'Customer');
        final email =
            home != null && home.customerEmail.isNotEmpty
                ? home.customerEmail
                : (user['email'] ?? '');
        final meterId = home != null && home.meterId.isNotEmpty
            ? home.meterId
            : (user['meterId'] ?? 'Not assigned');
        final zone = home?.zone ?? '—';
        final address = (home?.customerAddress ?? '').isEmpty
            ? 'Not provided'
            : home!.customerAddress;
        final accountStatus = home?.accountStatus ?? 'active';

        return RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const SizedBox(height: 8),
              CircleAvatar(
                radius: 44,
                backgroundColor: const Color(0xFF0D5C91),
                child: Text(
                  name.isNotEmpty ? name[0].toUpperCase() : '?',
                  style: const TextStyle(
                      fontSize: 36,
                      color: Colors.white,
                      fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                name,
                textAlign: TextAlign.center,
                style: Theme.of(ctx).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              if (email.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  email,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ],
              const SizedBox(height: 8),
              Center(
                child: _StatusPill(
                  label: _titleCase(accountStatus),
                  color: accountStatus == 'active'
                      ? const Color(0xFF15803D)
                      : const Color(0xFFD97706),
                  background: accountStatus == 'active'
                      ? const Color(0xFFDCFCE7)
                      : const Color(0xFFFEF3C7),
                ),
              ),
              const SizedBox(height: 20),
              const _SectionLabel('Customer information'),
              Card(
                child: Column(children: [
                  _InfoRow(
                    icon: Icons.sensors_outlined,
                    title: 'Meter ID',
                    value: meterId,
                    onTap: () => _copy(context, meterId, 'Meter ID'),
                  ),
                  const Divider(height: 1),
                  _InfoRow(
                    icon: Icons.map_outlined,
                    title: 'Distribution zone',
                    value: zone,
                  ),
                  const Divider(height: 1),
                  _InfoRow(
                    icon: Icons.home_outlined,
                    title: 'Service address',
                    value: address,
                  ),
                  const Divider(height: 1),
                  _InfoRow(
                    icon: Icons.badge_outlined,
                    title: 'Role',
                    value: _titleCase(user['role'] ?? 'customer'),
                  ),
                  const Divider(height: 1),
                  _InfoRow(
                    icon: Icons.fingerprint,
                    title: 'Account ID',
                    value: (user['userId'] ?? '').isEmpty
                        ? '—'
                        : user['userId']!,
                    onTap: () =>
                        _copy(context, user['userId'] ?? '', 'Account ID'),
                  ),
                ]),
              ),
              const SizedBox(height: 16),
              if (home != null) ...[
                const _SectionLabel('Meter details'),
                Card(
                  child: Column(children: [
                    _InfoRow(
                      icon: Icons.battery_charging_full_outlined,
                      title: 'Meter battery',
                      value: home.batteryPercent == null
                          ? 'Not reported'
                          : '${home.batteryPercent!.toStringAsFixed(0)}%',
                    ),
                    const Divider(height: 1),
                    _InfoRow(
                      icon: Icons.wifi_outlined,
                      title: 'Connection',
                      value: home.deviceOffline
                          ? 'Offline — showing last reading'
                          : _titleCase(home.connectionStatus),
                    ),
                    const Divider(height: 1),
                    _InfoRow(
                      icon: Icons.calendar_today_outlined,
                      title: 'Installed',
                      value: _formatDate(home.installedAt),
                    ),
                    const Divider(height: 1),
                    _InfoRow(
                      icon: Icons.update_outlined,
                      title: 'Last reading',
                      value: _formatDateTime(home.lastUpdatedAt),
                    ),
                  ]),
                ),
                const SizedBox(height: 16),
              ],
              const _SectionLabel('Preferences'),
              Card(
                child: Column(children: [
                  ListTile(
                    leading: const Icon(Icons.notifications_outlined,
                        color: Color(0xFF0D5C91)),
                    title: const Text('Notifications'),
                    subtitle:
                        const Text('Bills, water quality and ticket updates'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: widget.repo == null
                        ? null
                        : () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    NotificationsScreen(repo: widget.repo!),
                              ),
                            ),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.lock_outline,
                        color: Color(0xFF0D5C91)),
                    title: const Text('Change password'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _changePassword(context),
                  ),
                ]),
              ),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                icon: const Icon(Icons.logout, color: Colors.red),
                label:
                    const Text('Sign out', style: TextStyle(color: Colors.red)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.red),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () async {
                  await widget.authService.logout();
                  widget.onLogout();
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Future<void> _changePassword(BuildContext context) async {
    final oldController = TextEditingController();
    final newController = TextEditingController();
    String? error;
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setDialogState) => AlertDialog(
          title: const Text('Change password'),
          content: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(
                controller: oldController,
                obscureText: true,
                decoration:
                    const InputDecoration(labelText: 'Current password')),
            TextField(
                controller: newController,
                obscureText: true,
                decoration:
                    const InputDecoration(labelText: 'New password')),
            if (error != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(error!,
                    style: const TextStyle(color: Colors.red)),
              ),
          ]),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('Cancel')),
            FilledButton(
              onPressed: () async {
                try {
                  await widget.authService.changePassword(
                      oldController.text, newController.text);
                  if (dialogContext.mounted) Navigator.pop(dialogContext);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Password updated')));
                  }
                } catch (e) {
                  setDialogState(() => error =
                      e.toString().replaceFirst('Exception: ', ''));
                }
              },
              child: const Text('Update'),
            ),
          ],
        ),
      ),
    );
    oldController.dispose();
    newController.dispose();
  }

  String _titleCase(String value) => value
      .replaceAll('_', ' ')
      .split(' ')
      .map((word) => word.isEmpty
          ? word
          : '${word[0].toUpperCase()}${word.substring(1)}')
      .join(' ');

  String _formatDate(String? value) {
    if (value == null || value.isEmpty) return '—';
    final parsed = DateTime.tryParse(value);
    if (parsed == null) return value;
    final d = parsed.toLocal();
    return '${d.day.toString().padLeft(2, '0')}/'
        '${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  String _formatDateTime(String? value) {
    if (value == null || value.isEmpty) return 'No reading yet';
    final parsed = DateTime.tryParse(value);
    if (parsed == null) return value;
    final d = parsed.toLocal();
    return '${_formatDate(value)} ${d.hour.toString().padLeft(2, '0')}:'
        '${d.minute.toString().padLeft(2, '0')}';
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.title,
    required this.value,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String value;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: const Color(0xFF0D5C91)),
      title: Text(title),
      trailing: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 190),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Text(
                value,
                textAlign: TextAlign.right,
                overflow: TextOverflow.ellipsis,
                maxLines: 2,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
            if (onTap != null) ...[
              const SizedBox(width: 4),
              const Icon(Icons.copy_rounded, size: 14, color: Colors.grey),
            ],
          ],
        ),
      ),
      onTap: onTap,
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.6,
          color: Color(0xFF64748B),
        ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({
    required this.label,
    required this.color,
    required this.background,
  });

  final String label;
  final Color color;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
            fontSize: 12, fontWeight: FontWeight.w700, color: color),
      ),
    );
  }
}
