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

class _TechDrawerData {
  const _TechDrawerData(this.user, this.summary);

  final Map<String, String> user;
  final TechnicianSummary? summary;
}

class _TechnicianShellState extends State<TechnicianShell> {
  int _index = 0;
  late Future<_TechDrawerData> _drawerFuture;

  @override
  void initState() {
    super.initState();
    _drawerFuture = _loadDrawer();
  }

  Future<_TechDrawerData> _loadDrawer() async {
    final user = await widget.auth.getStoredUser();
    TechnicianSummary? summary;
    try {
      summary = await widget.repo.fetchSummary();
    } catch (_) {
      // The drawer still shows the cached session when the API is offline.
    }
    return _TechDrawerData(user, summary);
  }

  void _openProfile() {
    Navigator.pop(context);
    showDialog<void>(
      context: context,
      builder: (context) => FutureBuilder<_TechDrawerData>(
        future: _drawerFuture,
        builder: (context, snapshot) {
          final data = snapshot.data;
          final summary = data?.summary;
          final user = data?.user ?? const <String, String>{};
          final name = summary?.technicianName ?? user['name'] ?? 'Technician';
          final email = summary?.email ?? user['email'] ?? '';
          return AlertDialog(
            title: Text(name),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ProfileLine(label: 'Email', value: email),
                _ProfileLine(
                    label: 'Phone',
                    value: (summary?.phone.isNotEmpty ?? false)
                        ? summary!.phone
                        : 'Not provided'),
                _ProfileLine(
                    label: 'Zone', value: summary?.zone ?? 'Zone A'),
                _ProfileLine(
                    label: 'Specialization',
                    value: summary?.specialization ?? 'No specialization'),
                _ProfileLine(
                    label: 'Duty status',
                    value: _titleCase(summary?.dutyStatus ?? 'on_duty')),
                _ProfileLine(
                    label: 'Current jobs',
                    value: '${summary?.currentJobCount ?? 0}'),
                _ProfileLine(
                    label: 'Completed repairs',
                    value: '${summary?.completedRepairs ?? 0}'),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close'),
              ),
            ],
          );
        },
      ),
    );
  }

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
              tooltip: 'Notifications',
              onPressed: () => setState(() => _index = 2),
            ),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [
              FutureBuilder<_TechDrawerData>(
                future: _drawerFuture,
                builder: (context, snapshot) {
                  final data = snapshot.data;
                  final summary = data?.summary;
                  final user = data?.user ?? const <String, String>{};
                  final name =
                      summary?.technicianName ?? user['name'] ?? 'Technician';
                  final email = summary?.email ?? user['email'] ?? '';
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
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            _DrawerPill(
                              text: _titleCase(
                                  summary?.dutyStatus ?? 'on_duty'),
                            ),
                            const SizedBox(width: 6),
                            _DrawerPill(
                              text: summary?.zone ?? 'Zone A',
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.person_outline),
                title: const Text('My profile'),
                subtitle: Text(
                    'Specialization, zone and repair history'),
                onTap: _openProfile,
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

class _DrawerPill extends StatelessWidget {
  const _DrawerPill({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(text,
          style: const TextStyle(fontSize: 11, color: Colors.white)),
    );
  }
}

class _ProfileLine extends StatelessWidget {
  const _ProfileLine({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label,
                style: const TextStyle(
                    fontSize: 12, color: Color(0xFF64748B))),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w600)),
          ),
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
                Text('Hello, ${summary.technicianName.split(' ').first}',
                    style: const TextStyle(
                        fontSize: 24, fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                const Text('Work assigned by the operations team.',
                    style: TextStyle(color: Color(0xFF64748B))),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F5EF),
                    borderRadius: BorderRadius.circular(14),
                    border:
                        Border.all(color: const Color(0xFFBFE5D2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.engineering,
                          color: Color(0xFF1E6B52), size: 26),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${_titleCase(summary.dutyStatus)} • ${summary.zone}',
                              style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF1E6B52)),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              summary.specialization,
                              style: const TextStyle(
                                  fontSize: 12, color: Color(0xFF475569)),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('${summary.currentJobCount}',
                              style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF1E6B52))),
                          const Text('active jobs',
                              style: TextStyle(
                                  fontSize: 10.5, color: Color(0xFF475569))),
                        ],
                      ),
                    ],
                  ),
                ),
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
                      label: 'In progress',
                      value: summary.inProgress,
                      icon: Icons.autorenew,
                      color: const Color(0xFF7C3AED)),
                  const SizedBox(width: 12),
                  _MetricCard(
                      label: 'Resolved',
                      value: summary.resolved,
                      icon: Icons.check_circle_outline,
                      color: const Color(0xFF15803D)),
                ]),
                const SizedBox(height: 20),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.workspace_premium_outlined,
                        color: Color(0xFF1E6B52)),
                    title: Text(
                        '${summary.completedRepairs} completed repairs'),
                    subtitle: const Text(
                        'Your all-time resolved job count is tracked by the operations team.'),
                  ),
                ),
                const SizedBox(height: 10),
                const Card(
                  child: ListTile(
                    leading: Icon(Icons.security_outlined,
                        color: Color(0xFF1E6B52)),
                    title: Text('Read-only device diagnostics'),
                    subtitle: Text(
                        'Open an assigned ticket to inspect flow, turbidity, valve state, battery and recent alerts.'),
                  ),
                ),
                const SizedBox(height: 10),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.assignment_outlined,
                        color: Color(0xFF1E6B52)),
                    title: const Text('Ticket workflow'),
                    subtitle: Text(
                        '${summary.total} tickets total. Accept a job, start work, then resolve it with notes.'),
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
              children: [
                'All',
                'Assigned',
                'Accepted',
                'In Progress',
                'Resolved',
              ]
                  .map((filter) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(filter),
                          selected: _filter == filter,
                          onSelected: (_) => setState(() {
                            _filter = filter;
                            _future =
                                widget.repo.fetchTickets(status: filter);
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
                  return RefreshIndicator(
                    onRefresh: () async => _reload(),
                    child: ListView(
                      children: const [
                        SizedBox(height: 140),
                        Icon(Icons.assignment_turned_in_outlined,
                            size: 48, color: Color(0xFF94A3B8)),
                        SizedBox(height: 10),
                        Center(
                          child: Text('No tickets in this view.',
                              style:
                                  TextStyle(color: Color(0xFF64748B))),
                        ),
                      ],
                    ),
                  );
                }
                return RefreshIndicator(
                  onRefresh: () async => _reload(),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: tickets.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final ticket = tickets[index];
                      final color = _statusColor(ticket.status);
                      return Card(
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () async {
                            await Navigator.push<void>(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => TechnicianTicketDetail(
                                      repo: widget.repo, ticket: ticket)),
                            );
                            _reload();
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 18,
                                      backgroundColor:
                                          color.withValues(alpha: .13),
                                      child: Icon(Icons.build_outlined,
                                          size: 18, color: color),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(ticket.type,
                                          style: const TextStyle(
                                              fontWeight: FontWeight.w700,
                                              fontSize: 14.5)),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 9, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: color.withValues(alpha: .12),
                                        borderRadius:
                                            BorderRadius.circular(999),
                                      ),
                                      child: Text(
                                        _titleCase(
                                            ticket.status.replaceAll('_', ' ')),
                                        style: TextStyle(
                                            fontSize: 10.5,
                                            fontWeight: FontWeight.w700,
                                            color: color),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(ticket.description,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontSize: 12.5,
                                        color: Color(0xFF334155))),
                                const SizedBox(height: 8),
                                Wrap(
                                  spacing: 12,
                                  runSpacing: 4,
                                  children: [
                                    _MetaLine(
                                        icon: Icons.person_outline,
                                        text: ticket.customerName),
                                    _MetaLine(
                                        icon: Icons.flag_outlined,
                                        text: ticket.priority),
                                    _MetaLine(
                                        icon: Icons.schedule,
                                        text: _formatDate(ticket.createdAt)),
                                  ],
                                ),
                              ],
                            ),
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

class _MetaLine extends StatelessWidget {
  const _MetaLine({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: const Color(0xFF64748B)),
        const SizedBox(width: 3),
        Text(text,
            style:
                const TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
      ],
    );
  }
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
  TechnicianDeviceSnapshot? _deviceSnapshot;

  @override
  void initState() {
    super.initState();
    _loadDevice();
  }

  Future<void> _loadDevice() async {
    try {
      final snap = await widget.repo.fetchDevice(widget.ticket.id);
      if (mounted) setState(() => _deviceSnapshot = snap);
    } catch (_) {
      // non-fatal — location card shows gracefully without it
    }
  }

  Future<void> _transition(String status,
      {String? notes, String? rejectionReason, String? progressNotes}) async {
    setState(() => _loading = true);
    try {
      await widget.repo.updateTicket(widget.ticket.id, {
        'status': status,
        if (notes != null) 'notes': notes,
        if (rejectionReason != null) 'rejectionReason': rejectionReason,
        if (progressNotes != null) 'progressNotes': progressNotes,
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

  Future<String?> _askForText(String title, String label,
      {String initial = ''}) async {
    final controller = TextEditingController(text: initial);
    final result = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          maxLines: 4,
          decoration: InputDecoration(
              labelText: label, border: const OutlineInputBorder()),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () =>
                  Navigator.pop(dialogContext, controller.text.trim()),
              child: const Text('Submit')),
        ],
      ),
    );
    controller.dispose();
    if (result == null || result.trim().isEmpty) return null;
    return result.trim();
  }

  Future<void> _showMeterLocation() async {
    final snap = _deviceSnapshot;
    final latCtrl = TextEditingController(
      text: snap?.latitude != null ? snap!.latitude!.toStringAsFixed(6) : '',
    );
    final lngCtrl = TextEditingController(
      text: snap?.longitude != null ? snap!.longitude!.toStringAsFixed(6) : '',
    );
    String? dialogError;

    await showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.location_on_outlined, color: Color(0xFF1E6B52)),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Meter GPS Location',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
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
                  'Enter the exact location of the water meter. '
                  'Use a GPS app to get precise coordinates on-site.',
                  style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 16),
                if (snap?.latitude != null && snap?.longitude != null) ...[
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5EF),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFBFE5D2)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Current saved location',
                            style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF1E6B52))),
                        const SizedBox(height: 4),
                        Text(
                          'Lat: ${snap!.latitude!.toStringAsFixed(6)}\n'
                          'Lng: ${snap.longitude!.toStringAsFixed(6)}',
                          style: const TextStyle(
                              fontSize: 12.5,
                              fontFamily: 'monospace',
                              color: Color(0xFF334155)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                ],
                TextField(
                  controller: latCtrl,
                  keyboardType: const TextInputType.numberWithOptions(
                      signed: true, decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Latitude',
                    hintText: 'e.g. 9.023456',
                    border: OutlineInputBorder(),
                    isDense: true,
                    prefixIcon: Icon(Icons.north, size: 18),
                    suffixText: '°',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: lngCtrl,
                  keyboardType: const TextInputType.numberWithOptions(
                      signed: true, decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Longitude',
                    hintText: 'e.g. 38.765432',
                    border: OutlineInputBorder(),
                    isDense: true,
                    prefixIcon: Icon(Icons.east, size: 18),
                    suffixText: '°',
                  ),
                ),
                if (dialogError != null) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFEDED),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(dialogError!,
                        style: const TextStyle(
                            color: Color(0xFFDC2626), fontSize: 13)),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF1E6B52)),
              icon: const Icon(Icons.save_outlined, size: 16),
              label: const Text('Save Location'),
              onPressed: () async {
                final latVal = double.tryParse(latCtrl.text.trim());
                final lngVal = double.tryParse(lngCtrl.text.trim());
                if (latVal == null || latVal < -90 || latVal > 90) {
                  setDialogState(() =>
                      dialogError = 'Latitude must be a number between -90 and 90.');
                  return;
                }
                if (lngVal == null || lngVal < -180 || lngVal > 180) {
                  setDialogState(() =>
                      dialogError = 'Longitude must be a number between -180 and 180.');
                  return;
                }
                try {
                  await widget.repo.updateMeterLocation(
                      widget.ticket.id, latVal, lngVal);
                  if (!ctx.mounted) return;
                  _loadDevice();
                  Navigator.pop(ctx);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Location saved: ${latVal.toStringAsFixed(6)}°, ${lngVal.toStringAsFixed(6)}°'),
                        backgroundColor: const Color(0xFF1E6B52),
                      ),
                    );
                  }
                } catch (e) {
                  setDialogState(() =>
                      dialogError = e.toString().replaceFirst('Exception: ', ''));
                }
              },
            ),
          ],
        ),
      ),
    );
    latCtrl.dispose();
    lngCtrl.dispose();
  }

  Future<void> _showDevice() async {
    try {
      final snapshot = await widget.repo.fetchDevice(widget.ticket.id);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(snapshot.meterId),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _DeviceLine(
                    label: 'Connectivity', value: snapshot.connectivity),
                _DeviceLine(label: 'Zone', value: snapshot.zone),
                _DeviceLine(
                    label: 'Battery',
                    value: snapshot.batteryPercent == null
                        ? 'Not reported'
                        : '${snapshot.batteryPercent!.toStringAsFixed(0)}%'),
                _DeviceLine(
                    label: 'Flow',
                    value: '${snapshot.flowRate.toStringAsFixed(1)} L/min'),
                _DeviceLine(
                    label: 'Turbidity',
                    value:
                        '${snapshot.turbidity.toStringAsFixed(1)} NTU'),
                _DeviceLine(label: 'Valve', value: snapshot.valveState),
                _DeviceLine(
                    label: 'Last reading',
                    value: _formatDateTime(snapshot.lastUpdatedAt)),
                if (snapshot.alerts.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text('Recent alerts (${snapshot.alerts.length})',
                      style: const TextStyle(
                          color: Colors.orange,
                          fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  ...snapshot.alerts.take(5).map((alert) {
                    final text = alert is Map
                        ? alert['message']?.toString() ?? alert.toString()
                        : alert.toString();
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 2),
                      child: Text('• $text',
                          style: const TextStyle(fontSize: 12)),
                    );
                  }),
                ],
              ],
            ),
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
    final color = _statusColor(status);
    return Scaffold(
      appBar: AppBar(title: const Text('Ticket details')),
      body: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          Text(ticket.type,
              style:
                  const TextStyle(fontSize: 23, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: .12),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(_titleCase(status.replaceAll('_', ' ')),
                    style: TextStyle(
                        color: color,
                        fontWeight: FontWeight.w700,
                        fontSize: 11.5)),
              ),
              const SizedBox(width: 8),
              Text('Priority: ${ticket.priority}',
                  style: const TextStyle(
                      fontSize: 12, color: Color(0xFF64748B))),
            ],
          ),
          const SizedBox(height: 16),
          _TechnicianTimeline(status: status),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const _DetailLabel('Customer'),
                  Text(ticket.customerName,
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w600)),
                  if (ticket.customerAddress.isNotEmpty)
                    Text(ticket.customerAddress,
                        style: const TextStyle(color: Color(0xFF64748B))),
                  const SizedBox(height: 14),
                  const _DetailLabel('Reported issue'),
                  Text(ticket.description,
                      style: const TextStyle(
                          fontSize: 15, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 14),
                  const _DetailLabel('Reported'),
                  Text(_formatDateTime(ticket.createdAt),
                      style: const TextStyle(fontSize: 14)),
                  if (ticket.assignedAt != null) ...[
                    const SizedBox(height: 14),
                    const _DetailLabel('Assigned'),
                    Text(_formatDateTime(ticket.assignedAt!),
                        style: const TextStyle(fontSize: 14)),
                  ],
                  if (ticket.acceptedAt != null) ...[
                    const SizedBox(height: 14),
                    const _DetailLabel('Accepted'),
                    Text(_formatDateTime(ticket.acceptedAt!),
                        style: const TextStyle(fontSize: 14)),
                  ],
                ],
              ),
            ),
          ),
          if (ticket.progressNotes.isNotEmpty) ...[
            const SizedBox(height: 12),
            _NoteBox(
              title: 'Progress notes',
              body: ticket.progressNotes,
              color: const Color(0xFF0284C7),
              icon: Icons.build_circle_outlined,
            ),
          ],
          if (ticket.rejectionReason.isNotEmpty) ...[
            const SizedBox(height: 12),
            _NoteBox(
              title: 'Previous rejection reason',
              body: ticket.rejectionReason,
              color: const Color(0xFFDC2626),
              icon: Icons.report_gmailerrorred_outlined,
            ),
          ],
          if (ticket.notes.isNotEmpty) ...[
            const SizedBox(height: 12),
            _NoteBox(
              title: 'Resolution notes',
              body: ticket.notes,
              color: const Color(0xFF15803D),
              icon: Icons.check_circle_outline,
            ),
          ],
          const SizedBox(height: 14),
          OutlinedButton.icon(
              onPressed: _showDevice,
              icon: const Icon(Icons.sensors_outlined),
              label: const Text('View read-only sensor dashboard')),
          const SizedBox(height: 14),
          // ── Meter GPS location card ──────────────────────────────────────
          if (_deviceSnapshot != null) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            color: Color(0xFF1E6B52), size: 18),
                        const SizedBox(width: 6),
                        const Text(
                          'METER LOCATION',
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.5,
                            color: Color(0xFF94A3B8),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (_deviceSnapshot!.latitude != null &&
                        _deviceSnapshot!.longitude != null) ...[
                      Text(
                        'Latitude:  ${_deviceSnapshot!.latitude!.toStringAsFixed(6)}°',
                        style: const TextStyle(
                            fontSize: 13, fontFamily: 'monospace'),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Longitude: ${_deviceSnapshot!.longitude!.toStringAsFixed(6)}°',
                        style: const TextStyle(
                            fontSize: 13, fontFamily: 'monospace'),
                      ),
                    ] else
                      const Text(
                        'No location recorded yet.',
                        style: TextStyle(
                            fontSize: 13, color: Color(0xFF94A3B8)),
                      ),
                  ],
                ),
              ),
            ),
          ],
          if (status == 'accepted' || status == 'in_progress' || status == 'assigned') ...[
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: _loading ? null : _showMeterLocation,
              icon: const Icon(Icons.edit_location_alt_outlined, color: Color(0xFF1E6B52)),
              label: Text(
                _deviceSnapshot?.latitude != null
                    ? 'Update meter location'
                    : 'Set meter location',
                style: const TextStyle(color: Color(0xFF1E6B52)),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFF1E6B52)),
              ),
            ),
          ],
          const SizedBox(height: 4),
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
          if (status == 'accepted') ...[
            FilledButton.icon(
              onPressed: _loading
                  ? null
                  : () async {
                      final note = await _askForText(
                          'Start work', 'Progress note (optional)');
                      _transition('in_progress',
                          progressNotes: note ?? 'Work started.');
                    },
              icon: const Icon(Icons.play_arrow),
              label: const Text('Start work'),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
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
          if (status == 'in_progress') ...[
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
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: _loading
                  ? null
                  : () async {
                      final note = await _askForText(
                          'Update progress', 'Progress note');
                      if (note != null) {
                        _transition('in_progress', progressNotes: note);
                      }
                    },
              icon: const Icon(Icons.edit_note),
              label: const Text('Save progress note'),
            ),
          ],
        ],
      ),
    );
  }
}

class _TechnicianTimeline extends StatelessWidget {
  const _TechnicianTimeline({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    const steps = ['assigned', 'accepted', 'in progress', 'resolved'];
    final normalized = status.replaceAll('_', ' ');
    final current = steps.indexOf(normalized == 'open' ? 'assigned' : normalized);
    return Row(
      children: [
        for (var i = 0; i < steps.length; i++) ...[
          Expanded(
            child: Column(
              children: [
                Icon(
                  i <= current
                      ? Icons.check_circle
                      : Icons.radio_button_unchecked,
                  size: 20,
                  color: i <= current
                      ? const Color(0xFF1E6B52)
                      : const Color(0xFFCBD5E1),
                ),
                const SizedBox(height: 4),
                Text(
                  _titleCase(steps[i]),
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w600,
                    color: i <= current
                        ? const Color(0xFF1E6B52)
                        : const Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _DetailLabel extends StatelessWidget {
  const _DetailLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 3),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontSize: 10.5,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.5,
          color: Color(0xFF94A3B8),
        ),
      ),
    );
  }
}

class _DeviceLine extends StatelessWidget {
  const _DeviceLine({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(label,
                style: const TextStyle(
                    fontSize: 12, color: Color(0xFF64748B))),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

class _NoteBox extends StatelessWidget {
  const _NoteBox({
    required this.title,
    required this.body,
    required this.color,
    required this.icon,
  });

  final String title;
  final String body;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: color)),
                const SizedBox(height: 4),
                Text(body,
                    style: const TextStyle(
                        fontSize: 12.5, color: Color(0xFF334155))),
              ],
            ),
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

  void _reload() =>
      setState(() => _future = widget.repo.fetchNotifications());

  Future<void> _markAllRead() async {
    try {
      await widget.repo.markAllNotificationsRead();
      if (mounted) _reload();
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$error')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Align(
          alignment: Alignment.centerRight,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: TextButton.icon(
              onPressed: _markAllRead,
              icon: const Icon(Icons.done_all, size: 16),
              label: const Text('Mark all read'),
            ),
          ),
        ),
        Expanded(
          child: FutureBuilder<List<TechnicianNotification>>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return _RetryError(
                  message: '${snapshot.error}',
                  onRetry: _reload,
                );
              }
              final items = snapshot.data ?? [];
              if (items.isEmpty) {
                return RefreshIndicator(
                  onRefresh: () async => _reload(),
                  child: ListView(
                    children: const [
                      SizedBox(height: 140),
                      Icon(Icons.notifications_none,
                          size: 48, color: Color(0xFF94A3B8)),
                      SizedBox(height: 10),
                      Center(
                        child: Text('No notifications yet.',
                            style: TextStyle(color: Color(0xFF64748B))),
                      ),
                    ],
                  ),
                );
              }
              return RefreshIndicator(
                onRefresh: () async => _reload(),
                child: ListView.separated(
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
                            if (mounted) _reload();
                          }
                        },
                        leading: Icon(
                            item.read
                                ? Icons.notifications_none
                                : Icons.notifications_active,
                            color: const Color(0xFF1E6B52)),
                        title: Text(item.title,
                            style: TextStyle(
                                fontWeight: item.read
                                    ? FontWeight.w600
                                    : FontWeight.w800)),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 2),
                            Text(item.message),
                            const SizedBox(height: 4),
                            Text(_formatDateTime(item.createdAt),
                                style: const TextStyle(
                                    fontSize: 10.5,
                                    color: Color(0xFF94A3B8))),
                          ],
                        ),
                        isThreeLine: true,
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
    case 'in progress':
      return const Color(0xFF7C3AED);
    default:
      return const Color(0xFF64748B);
  }
}

String _titleCase(String value) => value
    .split(' ')
    .map((word) =>
        word.isEmpty ? word : '${word[0].toUpperCase()}${word.substring(1)}')
    .join(' ');

String _formatDate(String value) {
  if (value.isEmpty) return '—';
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return value;
  final d = parsed.toLocal();
  return '${d.day.toString().padLeft(2, '0')}/'
      '${d.month.toString().padLeft(2, '0')}/${d.year}';
}

String _formatDateTime(String? value) {
  if (value == null || value.isEmpty) return '—';
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return value;
  final d = parsed.toLocal();
  return '${_formatDate(value)} ${d.hour.toString().padLeft(2, '0')}:'
      '${d.minute.toString().padLeft(2, '0')}';
}
