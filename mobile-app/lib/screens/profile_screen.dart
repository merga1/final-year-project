import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/auth_service.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key, required this.authService, required this.onLogout});
  final AuthService authService;
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, String>>(
      future: authService.getStoredUser(),
      builder: (ctx, snap) {
        final user = snap.data ?? {};
        final name = user['name'] ?? 'Customer';
        final email = user['email'] ?? '';
        final meterId = user['meterId'] ?? 'Not assigned';

        return ListView(padding: const EdgeInsets.all(16), children: [
          const SizedBox(height: 16),
          CircleAvatar(radius: 44,
              backgroundColor: const Color(0xFF0D5C91),
              child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                  style: const TextStyle(fontSize: 36, color: Colors.white, fontWeight: FontWeight.bold))),
          const SizedBox(height: 12),
          Text(name, textAlign: TextAlign.center,
              style: Theme.of(ctx).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(email, textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600])),
          const SizedBox(height: 24),
          Card(child: Column(children: [
            ListTile(
              leading: const Icon(Icons.sensors_outlined, color: Color(0xFF0D5C91)),
              title: const Text('Meter ID'),
              trailing: Text(meterId, style: const TextStyle(fontWeight: FontWeight.w600)),
              onTap: () {
                Clipboard.setData(ClipboardData(text: meterId));
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Meter ID copied')));
              },
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.account_circle_outlined, color: Color(0xFF0D5C91)),
              title: const Text('Account Status'),
              trailing: const Text('Active', style: TextStyle(color: Color(0xFF2E8B57), fontWeight: FontWeight.w600)),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.notifications_outlined, color: Color(0xFF0D5C91)),
              title: const Text('Notifications'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {},
            ),
          ])),
          const SizedBox(height: 16),
          Card(child: ListTile(
            leading: const Icon(Icons.lock_outline, color: Color(0xFF0D5C91)),
            title: const Text('Change Password'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _changePassword(context),
          )),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            icon: const Icon(Icons.logout, color: Colors.red),
            label: const Text('Sign out', style: TextStyle(color: Colors.red)),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Colors.red),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: () async {
              await authService.logout();
              onLogout();
            },
          ),
        ]);
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
            TextField(controller: oldController, obscureText: true, decoration: const InputDecoration(labelText: 'Current password')),
            TextField(controller: newController, obscureText: true, decoration: const InputDecoration(labelText: 'New password')),
            if (error != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(error!, style: const TextStyle(color: Colors.red))),
          ]),
          actions: [
            TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Cancel')),
            FilledButton(
              onPressed: () async {
                try {
                  await authService.changePassword(oldController.text, newController.text);
                  if (dialogContext.mounted) Navigator.pop(dialogContext);
                  if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password updated')));
                } catch (e) {
                  setDialogState(() => error = e.toString().replaceFirst('Exception: ', ''));
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
}
