import 'package:flutter/material.dart';
import '../models/mobile_repository.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key, required this.repo});
  final MobileRepository repo;

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late Future<List<AppNotification>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.repo.fetchNotifications();
  }

  Future<void> _markRead(AppNotification notification) async {
    if (notification.read) return;
    await widget.repo.markNotificationRead(notification.id);
    if (mounted) setState(() => _future = widget.repo.fetchNotifications());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications', style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          TextButton(
            onPressed: () async {
              await widget.repo.markAllNotificationsRead();
              if (mounted) setState(() => _future = widget.repo.fetchNotifications());
            },
            child: const Text('Mark all read', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: FutureBuilder<List<AppNotification>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) return Center(child: Text('Could not load notifications: ${snapshot.error}'));
          final items = snapshot.data ?? [];
          if (items.isEmpty) return const Center(child: Text('No notifications yet.'));
          return RefreshIndicator(
            onRefresh: () async => setState(() => _future = widget.repo.fetchNotifications()),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, index) {
                final item = items[index];
                return InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => _markRead(item),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: item.read ? Colors.white : const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(_iconFor(item.type), color: const Color(0xFF0284C7)),
                        const SizedBox(width: 12),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(item.title, style: const TextStyle(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 4),
                          Text(item.message, style: const TextStyle(color: Color(0xFF475569))),
                          const SizedBox(height: 8),
                          Text(_formatDate(item.createdAt), style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                        ])),
                        if (!item.read) const Padding(padding: EdgeInsets.only(left: 8, top: 4), child: CircleAvatar(radius: 4, backgroundColor: Color(0xFF0284C7))),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  IconData _iconFor(String type) {
    if (type.contains('payment')) return Icons.payments_outlined;
    if (type.contains('ticket')) return Icons.support_agent_outlined;
    if (type.contains('quality')) return Icons.water_drop_outlined;
    if (type.contains('flow')) return Icons.warning_amber_rounded;
    return Icons.notifications_none_rounded;
  }

  String _formatDate(String value) {
    final parsed = DateTime.tryParse(value);
    if (parsed == null) return value;
    return '${parsed.toLocal().day.toString().padLeft(2, '0')}/${parsed.toLocal().month.toString().padLeft(2, '0')}/${parsed.toLocal().year}';
  }
}
