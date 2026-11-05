import 'package:flutter/material.dart';

import '../core/auth_service.dart';
import '../models/technician_models.dart';
import '../services/technician_repository.dart';

class TechnicianShell extends StatefulWidget {
  const TechnicianShell({
    super.key,
    required this.repo,
    required this.auth,
    required this.onLogout,
  });

  final TechnicianRepository repo;
  final AuthService auth;
  final VoidCallback onLogout;

  @override
  State<TechnicianShell> createState() => _TechnicianShellState();
}

class _TechnicianShellState extends State<TechnicianShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    const titles = ['Technician Home', 'My Tickets', 'Notifications'];
    final pages = [
      TechnicianHome(repo: widget.repo),
      TechnicianTickets(repo: widget.repo),
      TechnicianNotifications(repo: widget.repo),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(titles[_index],
            style: const TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: const Color(0xFF1E6B52),
        actions: [
          if (_index != 2)
            IconButton(
              icon: const Icon(Icons.notifications_none),
              onPressed: () => setState(() => _index = 2),
            ),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [
              FutureBuilder<Map<String, String>>(
                future: widget.auth.getStoredUser(),
                builder: (context, snapshot) {
                  final name = snapshot.data?['name'] ?? 'Technician';
                  final email = snapshot.data?['email'] ?? '';
                  return Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(22),
                    color: const Color(0xFF1E6B52),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.engineering,
                            color: Colors.white, size: 38),
                        const SizedBox(height: 10),
                        Text(name,
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 19,
                                fontWeight: FontWeight.w700)),
                        Text(email,
                            style: const TextStyle(color: Colors.white70)),
                        const Text('Field operations',
                            style: TextStyle(color: Colors.white70)),
                      ],
                    ),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.person_outline),
                title: const Text('Profile'),
                onTap: () async {
                  final profile = await widget.auth.getStoredUser();
                  if (!context.mounted) return;
                  Navigator.pop(context);
                  showDialog<void>(
                    context: context,
                    builder: (_) => AlertDialog(
                      title: Text(profile['name'] ?? 'Technician'),
                      content: Text(profile['email'] ?? ''),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Close'),
                        ),
                      ],
                    ),
                  );
                },
              ),
              const Spacer(),
              ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title: const Text('Sign out'),
                onTap: () {
                  Navigator.pop(context);
                  widget.onLogout();
                },
              ),
            ],
          ),
        ),
      ),
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (index) => setState(() => _index = index),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home),
              label: 'Home'),
          NavigationDestination(
              icon: Icon(Icons.assignment_outlined),
              selectedIcon: Icon(Icons.assignment),
              label: 'My Tickets'),
          NavigationDestination(
              icon: Icon(Icons.notifications_none),
              selectedIcon: Icon(Icons.notifications),
              label: 'Notifications'),
        ],
      ),
    );
  }
}

class TechnicianHome extends StatefulWidget {
  const TechnicianHome({super.key, required this.repo});
  final TechnicianRepository repo;

  @override
  State<TechnicianHome> createState() => _TechnicianHomeState();
}

class _TechnicianHomeState extends State<TechnicianHome> {
  late Future<TechnicianSummary> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.repo.fetchSummary();
  }

  void _reload() => setState(() => _future = widget.repo.fetchSummary());

  @override
  Widget build(BuildContext context) => FutureBuilder<TechnicianSummary>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return _RetryError(message: '${snapshot.error}', onRetry: _reload);
          }
          final summary = snapshot.data!;
          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView(
              padding: const EdgeInsets.all(18),
              children: [
                const Text('Today at a glance',
                    style:
                        TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                const Text('Work assigned by the operations team.',
                    style: TextStyle(color: Color(0xFF64748B))),
                const SizedBox(height: 20),
                Row(children: [
                  _MetricCard(
                      label: 'Assigned',
                      value: summary.assigned,
                      icon: Icons.assignment_late_outlined,
                      color: const Color(0xFFD97706)),
                  const SizedBox(width: 12),
                  _MetricCard(
                      label: 'Accepted',
                      value: summary.accepted,
                      icon: Icons.handyman_outlined,
                      color: const Color(0xFF0284C7)),
                ]),
                const SizedBox(height: 12),
                Row(children: [
                  _MetricCard(
                      label: 'Resolved',
                      value: summary.resolved,
                      icon: Icons.check_circle_outline,
                      color: const Color(0xFF15803D)),
                  const SizedBox(width: 12),
                  const Expanded(child: SizedBox()),
                ]),
                const SizedBox(height: 24),
                const Card(
                  child: ListTile(
                    leading: Icon(Icons.security_outlined,
                        color: Color(0xFF1E6B52)),
                    title: Text('Read-only device diagnostics'),
                    subtitle: Text(
                        'Open an assigned ticket to inspect flow, turbidity, valve state and recent alerts.'),
                  ),
                ),
              ],
            ),
          );
        },
      );
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final int value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) => Expanded(
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, color: color),
                const SizedBox(height: 12),
                Text('$value',
                    style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: color)),
                Text(label, style: const TextStyle(color: Color(0xFF64748B))),
              ],
            ),
          ),
        ),
      );
}

class TechnicianTickets extends StatefulWidget {
  const TechnicianTickets({super.key, required this.repo});
  final TechnicianRepository repo;

  @override
  State<TechnicianTickets> createState() => _TechnicianTicketsState();
}

class _TechnicianTicketsState extends State<TechnicianTickets> {
  String _filter = 'All';
  late Future<List<TechnicianTicket>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.repo.fetchTickets();
  }

  void _reload() => setState(
      () => _future = widget.repo.fetchTickets(status: _filter));

  @override
  Widget build(BuildContext context) => Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            child: Row(
              children: ['All', 'Assigned', 'Accepted', 'Resolved']
                  .map((filter) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(filter),
                          selected: _filter == filter,
                          onSelected: (_) => setState(() {
                            _filter = filter;
                            _future = widget.repo.fetchTickets(status: filter);
                          }),
                        ),
                      ))
                  .toList(),
            ),
          ),
          Expanded(
            child: FutureBuilder<List<TechnicianTicket>>(
              future: _future,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return _RetryError(
                      message: '${snapshot.error}', onRetry: _reload);
                }
                final tickets = snapshot.data ?? [];
                if (tickets.isEmpty) {
                  return const Center(child: Text('No assigned tickets.'));
                }
                return RefreshIndicator(
                  onRefresh: () async => _reload(),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: tickets.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final ticket = tickets[index];
                      return Card(
                        child: ListTile(
                          onTap: () async {
                            await Navigator.push<void>(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => TechnicianTicketDetail(
                                      repo: widget.repo, ticket: ticket)),
                            );
                            _reload();
                          },
                          leading: CircleAvatar(
                            backgroundColor:
                                _statusColor(ticket.status).withValues(alpha: .13),
                            child: Icon(Icons.build_outlined,
                                color: _statusColor(ticket.status)),
                          ),
                          title: Text(ticket.type,
                              style:
                                  const TextStyle(fontWeight: FontWeight.w700)),
                          subtitle: Text(
                              '${ticket.customerName}\n${ticket.description}',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis),
                          isThreeLine: true,
                          trailing: Text(
                            _titleCase(ticket.status.replaceAll('_', ' ')),
                            style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: _statusColor(ticket.status)),
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      );
}

class TechnicianTicketDetail extends StatefulWidget {
  const TechnicianTicketDetail({
    super.key,
    required this.repo,
    required this.ticket,
  });

  final TechnicianRepository repo;
  final TechnicianTicket ticket;

  @override
  State<TechnicianTicketDetail> createState() =>
      _TechnicianTicketDetailState();
}

class _TechnicianTicketDetailState extends State<TechnicianTicketDetail> {
  bool _loading = false;

  Future<void> _transition(String status,
      {String? notes, String? rejectionReason}) async {
    setState(() => _loading = true);
    try {
      await widget.repo.updateTicket(widget.ticket.id, {
        'status': status,
        if (notes != null) 'notes': notes,
        if (rejectionReason != null) 'rejectionReason': rejectionReason,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Ticket ${_titleCase(status)} update saved')));
        Navigator.pop(context);
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<String?> _askForText(String title, String label) async {
    final controller = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          maxLines: 4,
          decoration:
              InputDecoration(labelText: label, border: const OutlineInputBorder()),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(dialogContext, controller.text.trim()),
              child: const Text('Submit')),
        ],
      ),
    );
    controller.dispose();
    if (result == null || result.trim().isEmpty) return null;
    return result.trim();
  }

  Future<void> _showDevice() async {
    try {
      final snapshot = await widget.repo.fetchDevice(widget.ticket.id);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(snapshot.meterId),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Connectivity: ${snapshot.connectivity}'),
              Text('Flow: ${snapshot.flowRate.toStringAsFixed(1)} L/min'),
              Text('Turbidity: ${snapshot.turbidity.toStringAsFixed(1)} NTU'),
              Text('Valve: ${snapshot.valveState}'),
              const SizedBox(height: 10),
              if (snapshot.alerts.isNotEmpty)
                Text('Recent alerts: ${snapshot.alerts.length}',
                    style: const TextStyle(color: Colors.orange)),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close')),
          ],
        ),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$error')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final ticket = widget.ticket;
    final status = ticket.status.toLowerCase();
    return Scaffold(
      appBar: AppBar(title: const Text('Ticket details')),
      body: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          Text(ticket.type,
              style:
                  const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text(_titleCase(status.replaceAll('_', ' ')),
              style: TextStyle(
                  color: _statusColor(status), fontWeight: FontWeight.w700)),
          const SizedBox(height: 20),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Customer',
                      style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w700)),
                  Text(ticket.customerName,
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w600)),
                  if (ticket.customerAddress.isNotEmpty)
                    Text(ticket.customerAddress,
                        style: const TextStyle(color: Color(0xFF64748B))),
                  const SizedBox(height: 14),
                  const Text('Issue',
                      style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w700)),
                  Text(ticket.description,
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          OutlinedButton.icon(
              onPressed: _showDevice,
              icon: const Icon(Icons.sensors_outlined),
              label: const Text('View read-only sensor dashboard')),
          const SizedBox(height: 14),
          if (status == 'assigned')
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _loading
                        ? null
                        : () async {
                            final reason = await _askForText(
                                'Reject assignment', 'Reason');
                            if (reason != null) {
                              _transition('rejected', rejectionReason: reason);
                            }
                          },
                    child: const Text('Reject'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton(
                      onPressed: _loading
                          ? null
                          : () => _transition('accepted'),
                      child: const Text('Accept')),
                ),
              ],
            ),
          if (status == 'accepted' || status == 'in_progress')
            FilledButton.icon(
              onPressed: _loading
                  ? null
                  : () async {
                      final notes = await _askForText(
                          'Resolve ticket', 'Resolution notes');
                      if (notes != null) _transition('resolved', notes: notes);
                    },
              icon: const Icon(Icons.check),
              label: const Text('Resolve ticket'),
            ),
        ],
      ),
    );
  }
}

class TechnicianNotifications extends StatefulWidget {
  const TechnicianNotifications({super.key, required this.repo});
  final TechnicianRepository repo;

  @override
  State<TechnicianNotifications> createState() =>
      _TechnicianNotificationsState();
}

class _TechnicianNotificationsState extends State<TechnicianNotifications> {
  late Future<List<TechnicianNotification>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.repo.fetchNotifications();
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<List<TechnicianNotification>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return _RetryError(
              message: '${snapshot.error}',
              onRetry: () => setState(
                  () => _future = widget.repo.fetchNotifications()),
            );
          }
          final items = snapshot.data ?? [];
          if (items.isEmpty) {
            return const Center(child: Text('No notifications yet.'));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final item = items[index];
              return Card(
                child: ListTile(
                  onTap: () async {
                    if (!item.read) {
                      await widget.repo.markNotificationRead(item.id);
                      if (mounted) {
                        setState(() =>
                            _future = widget.repo.fetchNotifications());
                      }
                    }
                  },
                  leading: Icon(
                      item.read
                          ? Icons.notifications_none
                          : Icons.notifications_active,
                      color: const Color(0xFF1E6B52)),
                  title: Text(item.title,
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text(item.message),
                ),
              );
            },
          );
        },
      );
}

class _RetryError extends StatelessWidget {
  const _RetryError({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off_outlined,
                  size: 48, color: Colors.grey),
              const SizedBox(height: 10),
              Text(message, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              FilledButton(onPressed: onRetry, child: const Text('Retry')),
            ],
          ),
        ),
      );
}

Color _statusColor(String status) {
  switch (status.toLowerCase()) {
    case 'resolved':
    case 'closed':
      return const Color(0xFF15803D);
    case 'accepted':
    case 'in_progress':
      return const Color(0xFF0284C7);
    case 'assigned':
      return const Color(0xFFD97706);
    default:
      return const Color(0xFF64748B);
  }
}

String _titleCase(String value) => value
    .split(' ')
    .map((word) =>
        word.isEmpty ? word : '${word[0].toUpperCase()}${word.substring(1)}')
    .join(' ');
