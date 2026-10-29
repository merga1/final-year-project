import 'package:flutter/material.dart';
import 'core/api_client.dart';
import 'core/auth_service.dart';
import 'models/technician_models.dart';
import 'repository.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const TechnicianApp());
}

class TechnicianApp extends StatelessWidget {
  const TechnicianApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'AquaSense Technician',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1E6B52)), useMaterial3: true, scaffoldBackgroundColor: const Color(0xFFF7FAF9)),
        home: const AppRoot(),
      );
}

class AppRoot extends StatefulWidget {
  const AppRoot({super.key});
  @override
  State<AppRoot> createState() => _AppRootState();
}

class _AppRootState extends State<AppRoot> {
  final _client = TechnicianApiClient();
  late final TechnicianAuthService _auth = TechnicianAuthService(_client);
  late final TechnicianRepository _repo = TechnicianRepository(_client);
  bool _ready = false;
  bool _loggedIn = false;

  @override
  void initState() { super.initState(); _restore(); }

  Future<void> _restore() async {
    final result = await _auth.restore();
    if (mounted) setState(() { _ready = true; _loggedIn = result; });
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (!_loggedIn) return TechnicianLogin(auth: _auth, onLogin: () => setState(() => _loggedIn = true));
    return TechnicianShell(repo: _repo, auth: _auth, onLogout: () => setState(() => _loggedIn = false));
  }
}

class TechnicianLogin extends StatefulWidget {
  const TechnicianLogin({super.key, required this.auth, required this.onLogin});
  final TechnicianAuthService auth;
  final VoidCallback onLogin;
  @override
  State<TechnicianLogin> createState() => _TechnicianLoginState();
}

class _TechnicianLoginState extends State<TechnicianLogin> {
  final _email = TextEditingController(text: 'john.smith@tech.water');
  final _password = TextEditingController(text: 'technician123');
  bool _loading = false;
  String? _error;

  @override
  void dispose() { _email.dispose(); _password.dispose(); super.dispose(); }

  Future<void> _submit() async {
    if (_email.text.trim().isEmpty || !_email.text.contains('@')) { setState(() => _error = 'Enter a valid email.'); return; }
    if (_password.text.isEmpty) { setState(() => _error = 'Enter your password.'); return; }
    setState(() { _loading = true; _error = null; });
    try { await widget.auth.login(_email.text, _password.text); widget.onLogin(); }
    catch (e) { if (mounted) setState(() => _error = e.toString().replaceFirst('Exception: ', '')); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(Icons.engineering_rounded, size: 64, color: Color(0xFF1E6B52)),
                  const SizedBox(height: 12),
                  const Text('AquaSense Technician', textAlign: TextAlign.center, style: TextStyle(fontSize: 25, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  const Text('Sign in to manage assigned water service tickets.', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF64748B))),
                  const SizedBox(height: 28),
                  TextField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Work email', border: OutlineInputBorder())),
                  const SizedBox(height: 14),
                  TextField(controller: _password, obscureText: true, onSubmitted: (_) => _submit(), decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder())),
                  if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error))),
                  const SizedBox(height: 20),
                  FilledButton(onPressed: _loading ? null : _submit, child: _loading ? const CircularProgressIndicator() : const Text('Sign in')),
                  const SizedBox(height: 16),
                  const Text('Demo technician: john.smith@tech.water / technician123', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class TechnicianShell extends StatefulWidget {
  const TechnicianShell({super.key, required this.repo, required this.auth, required this.onLogout});
  final TechnicianRepository repo;
  final TechnicianAuthService auth;
  final VoidCallback onLogout;
  @override
  State<TechnicianShell> createState() => _TechnicianShellState();
}

class _TechnicianShellState extends State<TechnicianShell> {
  int _index = 0;
  @override
  Widget build(BuildContext context) {
    final pages = [TechnicianHome(repo: widget.repo), TechnicianTickets(repo: widget.repo), TechnicianNotifications(repo: widget.repo)];
    final titles = ['Technician Home', 'My Tickets', 'Notifications'];
    return Scaffold(
      appBar: AppBar(title: Text(titles[_index], style: const TextStyle(fontWeight: FontWeight.w700)), actions: [if (_index != 2) IconButton(icon: const Icon(Icons.notifications_none), onPressed: () => setState(() => _index = 2))]),
      drawer: Drawer(child: SafeArea(child: Column(children: [
        Container(width: double.infinity, padding: const EdgeInsets.all(22), color: const Color(0xFF1E6B52), child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(Icons.engineering, color: Colors.white, size: 38), SizedBox(height: 10), Text('Field operations', style: TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.w700)), Text('AquaSense Technician', style: TextStyle(color: Colors.white70))])),
        ListTile(leading: const Icon(Icons.person_outline), title: const Text('Profile'), onTap: () async { final p = await widget.auth.profile(); if (!context.mounted) return; Navigator.pop(context); showDialog(context: context, builder: (_) => AlertDialog(title: Text(p['name'] ?? 'Technician'), content: Text(p['email'] ?? ''), actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close'))])); }),
        const Spacer(),
        ListTile(leading: const Icon(Icons.logout, color: Colors.red), title: const Text('Sign out'), onTap: () { Navigator.pop(context); widget.auth.logout(); widget.onLogout(); }),
      ]))),
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: NavigationBar(selectedIndex: _index, onDestinationSelected: (i) => setState(() => _index = i), destinations: const [NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'), NavigationDestination(icon: Icon(Icons.assignment_outlined), selectedIcon: Icon(Icons.assignment), label: 'My Tickets'), NavigationDestination(icon: Icon(Icons.notifications_none), selectedIcon: Icon(Icons.notifications), label: 'Notifications')]),
    );
  }
}

class TechnicianHome extends StatelessWidget {
  const TechnicianHome({super.key, required this.repo});
  final TechnicianRepository repo;
  @override
  Widget build(BuildContext context) => FutureBuilder<TechnicianSummary>(
        future: repo.fetchSummary(),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator());
          if (snapshot.hasError) return _ErrorRetry(message: snapshot.error.toString(), onRetry: () => (context as Element).markNeedsBuild());
          final summary = snapshot.data!;
          return RefreshIndicator(onRefresh: () async => (context as Element).markNeedsBuild(), child: ListView(padding: const EdgeInsets.all(18), children: [
            const Text('Today at a glance', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            const Text('Work assigned by the operations team.', style: TextStyle(color: Color(0xFF64748B))),
            const SizedBox(height: 20),
            Row(children: [_MetricCard(label: 'Assigned', value: summary.assigned, icon: Icons.assignment_late_outlined, color: const Color(0xFFD97706)), const SizedBox(width: 12), _MetricCard(label: 'Accepted', value: summary.accepted, icon: Icons.handyman_outlined, color: const Color(0xFF0284C7))]),
            const SizedBox(height: 12),
            Row(children: [_MetricCard(label: 'Resolved', value: summary.resolved, icon: Icons.check_circle_outline, color: const Color(0xFF15803D)), const SizedBox(width: 12), const Expanded(child: SizedBox())]),
            const SizedBox(height: 24),
            const Card(child: ListTile(leading: Icon(Icons.security_outlined, color: Color(0xFF1E6B52)), title: Text('Read-only device diagnostics'), subtitle: Text('Open a ticket to inspect flow, turbidity, valve state and recent alerts.'))),
          ]));
        },
      );
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.label, required this.value, required this.icon, required this.color});
  final String label; final int value; final IconData icon; final Color color;
  @override
  Widget build(BuildContext context) => Expanded(child: Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(icon, color: color), const SizedBox(height: 12), Text('$value', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: color)), Text(label, style: const TextStyle(color: Color(0xFF64748B)))]))));
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
  void initState() { super.initState(); _future = widget.repo.fetchTickets(); }
  void _reload() => setState(() => _future = widget.repo.fetchTickets(status: _filter));
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
          child: Row(
            children: ['All', 'Assigned', 'Accepted', 'Resolved'].map((filter) {
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(filter),
                  selected: _filter == filter,
                  onSelected: (_) {
                    setState(() => _filter = filter);
                    _reload();
                  },
                ),
              );
            }).toList(),
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
                return _ErrorRetry(message: snapshot.error.toString(), onRetry: _reload);
              }
              final tickets = snapshot.data ?? [];
              if (tickets.isEmpty) return const Center(child: Text('No assigned tickets.'));
              return RefreshIndicator(
                onRefresh: () async => _reload(),
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: tickets.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, index) {
                    final ticket = tickets[index];
                    return Card(
                      child: ListTile(
                        onTap: () async {
                          await Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => TicketDetail(repo: widget.repo, ticket: ticket)),
                          );
                          _reload();
                        },
                        leading: CircleAvatar(
                          backgroundColor: _statusColor(ticket.status).withValues(alpha: .13),
                          child: Icon(Icons.build_outlined, color: _statusColor(ticket.status)),
                        ),
                        title: Text(ticket.type, style: const TextStyle(fontWeight: FontWeight.w700)),
                        subtitle: Text('${ticket.customerName}\n${ticket.description}', maxLines: 2, overflow: TextOverflow.ellipsis),
                        isThreeLine: true,
                        trailing: Text(
                          _titleCase(ticket.status.replaceAll('_', ' ')),
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: _statusColor(ticket.status)),
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
}

class TicketDetail extends StatefulWidget {
  const TicketDetail({super.key, required this.repo, required this.ticket});
  final TechnicianRepository repo; final TechnicianTicket ticket;
  @override
  State<TicketDetail> createState() => _TicketDetailState();
}

class _TicketDetailState extends State<TicketDetail> {
  bool _loading = false;
  Future<void> _transition(String status, {String? notes, String? rejectionReason}) async {
    setState(() => _loading = true);
    try { await widget.repo.updateTicket(widget.ticket.id, {'status': status, if (notes != null) 'notes': notes, if (rejectionReason != null) 'rejectionReason': rejectionReason}); if (mounted) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Ticket ${_titleCase(status)} update saved'))); Navigator.pop(context); } }
    catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()))); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _reject() async { final controller = TextEditingController(); final reason = await showDialog<String>(context: context, builder: (context) => AlertDialog(title: const Text('Reject assignment'), content: TextField(controller: controller, maxLines: 3, decoration: const InputDecoration(labelText: 'Reason', border: OutlineInputBorder())), actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')), FilledButton(onPressed: () => Navigator.pop(context, controller.text.trim()), child: const Text('Reject'))])); controller.dispose(); if (reason != null && reason.isNotEmpty) _transition('rejected', rejectionReason: reason); }

  Future<void> _resolve() async { final controller = TextEditingController(); final notes = await showDialog<String>(context: context, builder: (context) => AlertDialog(title: const Text('Resolve ticket'), content: TextField(controller: controller, maxLines: 5, decoration: const InputDecoration(labelText: 'Resolution notes', hintText: 'Describe work completed and parts replaced', border: OutlineInputBorder())), actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')), FilledButton(onPressed: () => Navigator.pop(context, controller.text.trim()), child: const Text('Resolve'))])); controller.dispose(); if (notes != null && notes.isNotEmpty) _transition('resolved', notes: notes); }

  @override
  Widget build(BuildContext context) { final t = widget.ticket; final normalized = t.status.toLowerCase(); return Scaffold(appBar: AppBar(title: const Text('Ticket details')), body: ListView(padding: const EdgeInsets.all(18), children: [Text(t.type, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)), const SizedBox(height: 6), Text(_titleCase(normalized.replaceAll('_', ' ')), style: TextStyle(color: _statusColor(t.status), fontWeight: FontWeight.w700)), const SizedBox(height: 20), Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Customer', style: _label), Text(t.customerName, style: _value), if (t.customerAddress.isNotEmpty) Text(t.customerAddress, style: const TextStyle(color: Color(0xFF64748B))), const SizedBox(height: 14), Text('Issue', style: _label), Text(t.description, style: _value)]))), const SizedBox(height: 14), OutlinedButton.icon(onPressed: () async { final snapshot = await widget.repo.fetchDevice(t.id); if (!context.mounted) return; showDialog(context: context, builder: (_) => _DeviceDialog(snapshot: snapshot)); }, icon: const Icon(Icons.sensors_outlined), label: const Text('View read-only sensor dashboard')), const SizedBox(height: 14), if (normalized == 'assigned') Row(children: [Expanded(child: OutlinedButton(onPressed: _loading ? null : _reject, child: const Text('Reject'))), const SizedBox(width: 10), Expanded(child: FilledButton(onPressed: _loading ? null : () => _transition('accepted'), child: const Text('Accept')))]), if (normalized == 'accepted' || normalized == 'in_progress') FilledButton.icon(onPressed: _loading ? null : _resolve, icon: const Icon(Icons.check), label: const Text('Resolve ticket'))])); }
  TextStyle get _label => const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w700);
  TextStyle get _value => const TextStyle(fontSize: 16, fontWeight: FontWeight.w600);
}

class _DeviceDialog extends StatelessWidget { const _DeviceDialog({required this.snapshot}); final DeviceSnapshot snapshot; @override Widget build(BuildContext context) => AlertDialog(title: Text(snapshot.meterId), content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Connectivity: ${snapshot.connectivity}'), Text('Flow: ${snapshot.flowRate.toStringAsFixed(1)} L/min'), Text('Turbidity: ${snapshot.turbidity.toStringAsFixed(1)} NTU'), Text('Valve: ${snapshot.valveState}'), const SizedBox(height: 10), if (snapshot.alerts.isNotEmpty) Text('Recent alerts: ${snapshot.alerts.length}', style: const TextStyle(color: Colors.orange))]), actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close'))]); }

class TechnicianNotifications extends StatefulWidget { const TechnicianNotifications({super.key, required this.repo}); final TechnicianRepository repo; @override State<TechnicianNotifications> createState() => _TechnicianNotificationsState(); }
class _TechnicianNotificationsState extends State<TechnicianNotifications> { late Future<List<TechnicianNotification>> _future; @override void initState() { super.initState(); _future = widget.repo.fetchNotifications(); } @override Widget build(BuildContext context) => FutureBuilder<List<TechnicianNotification>>(future: _future, builder: (context, snapshot) { if (snapshot.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator()); if (snapshot.hasError) return _ErrorRetry(message: snapshot.error.toString(), onRetry: () => setState(() => _future = widget.repo.fetchNotifications())); final items = snapshot.data ?? []; if (items.isEmpty) return const Center(child: Text('No notifications yet.')); return ListView.separated(padding: const EdgeInsets.all(16), itemCount: items.length, separatorBuilder: (_, __) => const SizedBox(height: 8), itemBuilder: (_, index) { final item = items[index]; return Card(child: ListTile(onTap: () async { if (!item.read) { await widget.repo.markRead(item.id); if (mounted) setState(() => _future = widget.repo.fetchNotifications()); } }, leading: Icon(item.read ? Icons.notifications_none : Icons.notifications_active, color: const Color(0xFF1E6B52)), title: Text(item.title, style: const TextStyle(fontWeight: FontWeight.w700)), subtitle: Text(item.message))); }); }); }

class _ErrorRetry extends StatelessWidget { const _ErrorRetry({required this.message, required this.onRetry}); final String message; final VoidCallback onRetry; @override Widget build(BuildContext context) => Center(child: Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, children: [const Icon(Icons.cloud_off_outlined, size: 48, color: Colors.grey), const SizedBox(height: 10), Text(message, textAlign: TextAlign.center), const SizedBox(height: 12), FilledButton(onPressed: onRetry, child: const Text('Retry'))]))); }

Color _statusColor(String status) { switch (status.toLowerCase()) { case 'resolved': case 'closed': return const Color(0xFF15803D); case 'accepted': case 'in_progress': return const Color(0xFF0284C7); case 'assigned': return const Color(0xFFD97706); default: return const Color(0xFF64748B); } }
String _titleCase(String value) => value.split(' ').map((word) => word.isEmpty ? word : '${word[0].toUpperCase()}${word.substring(1)}').join(' ');
