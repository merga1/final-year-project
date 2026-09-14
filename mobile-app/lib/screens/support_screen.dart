import 'package:flutter/material.dart';
import '../models/mobile_repository.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key, required this.repo});
  final MobileRepository repo;

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  late Future<List<SupportTicket>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.repo.fetchTickets();
  }

  Color _statusColor(String s) => switch (s) {
    'resolved' || 'closed' => const Color(0xFF2E8B57),
    'open' => const Color(0xFF8B1E3F),
    _ => const Color(0xFF9C6B00),
  };

  Future<void> _createTicket() async {
    final formKey = GlobalKey<FormState>();
    String issue = '';
    String priority = 'Medium';

    final confirmed = await showDialog<bool>(context: context, builder: (ctx) {
      return AlertDialog(
        title: const Text('New Support Ticket'),
        content: Form(key: formKey, child: Column(mainAxisSize: MainAxisSize.min, children: [
          TextFormField(
            decoration: const InputDecoration(labelText: 'Describe your issue', border: OutlineInputBorder()),
            maxLines: 3,
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            onSaved: (v) => issue = v!.trim(),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: priority,
            decoration: const InputDecoration(labelText: 'Priority', border: OutlineInputBorder()),
            items: ['High', 'Medium', 'Low'].map((p) =>
                DropdownMenuItem(value: p, child: Text(p))).toList(),
            onChanged: (v) => priority = v!,
          ),
        ])),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () {
            if (formKey.currentState!.validate()) {
              formKey.currentState!.save();
              Navigator.pop(ctx, true);
            }
          }, child: const Text('Submit')),
        ],
      );
    });

    if (confirmed != true) return;
    try {
      await widget.repo.createTicket(issue, priority);
      setState(() => _future = widget.repo.fetchTickets());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Ticket submitted successfully')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<SupportTicket>>(
      future: _future,
      builder: (ctx, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        final tickets = snap.data ?? [];

        return RefreshIndicator(
          onRefresh: () async => setState(() => _future = widget.repo.fetchTickets()),
          child: ListView(padding: const EdgeInsets.all(16), children: [
            Row(children: [
              Expanded(child: Text('Support Tickets',
                  style: Theme.of(ctx).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold))),
              FilledButton.icon(
                icon: const Icon(Icons.add, size: 18),
                label: const Text('New'),
                onPressed: _createTicket,
              ),
            ]),
            const SizedBox(height: 4),
            Text('${tickets.length} ticket(s)', style: TextStyle(color: Colors.grey[600])),
            const SizedBox(height: 16),
            if (tickets.isEmpty)
              const Center(child: Padding(padding: EdgeInsets.all(32),
                  child: Text('No support tickets yet.\nTap "New" to raise one.',
                      textAlign: TextAlign.center)))
            else ...tickets.map((t) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: _statusColor(t.status).withValues(alpha: 0.15),
                  child: Icon(Icons.support_agent_outlined, color: _statusColor(t.status)),
                ),
                title: Text(t.issue, maxLines: 2, overflow: TextOverflow.ellipsis),
                subtitle: Text('${t.priority} priority • ${t.status}',
                    style: TextStyle(color: _statusColor(t.status))),
                trailing: Text(t.createdAt.substring(0, 10),
                    style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ),
            )),
          ]),
        );
      },
    );
  }
}
