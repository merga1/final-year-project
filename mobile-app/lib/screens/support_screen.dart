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

  Future<void> _refresh() async {
    setState(() => _future = widget.repo.fetchTickets());
    await _future;
  }

  Future<void> _openCreateTicketScreen() async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => _CreateTicketScreen(
          onSubmit: (type, desc) async {
            await widget.repo
                .createTicket(desc, 'Medium', type: type, description: desc);
            await _refresh();
          },
        ),
      ),
    );
    if (mounted) _refresh();
  }

  Future<void> _openTicket(SupportTicket ticket) async {
    await Navigator.push<void>(
      context,
      MaterialPageRoute(
        builder: (_) =>
            _TicketDetailScreen(repo: widget.repo, ticket: ticket),
      ),
    );
    if (mounted) _refresh();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: FutureBuilder<List<SupportTicket>>(
        future: _future,
        builder: (ctx, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.support_agent_outlined,
                        size: 48, color: Colors.grey),
                    const SizedBox(height: 10),
                    Text('Could not load your tickets: ${snap.error}',
                        textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    FilledButton.icon(
                      onPressed: _refresh,
                      icon: const Icon(Icons.refresh, size: 16),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }
          final tickets = snap.data ?? [];

          return RefreshIndicator(
            onRefresh: _refresh,
            child: tickets.isEmpty
                ? ListView(
                    children: [
                      const SizedBox(height: 120),
                      const Icon(Icons.support_agent_outlined,
                          size: 52, color: Color(0xFF94A3B8)),
                      const SizedBox(height: 12),
                      Center(
                        child: Text(
                          'No support tickets yet.\nTap "+" below to report an issue.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              fontSize: 14, color: Colors.grey[500]),
                        ),
                      ),
                    ],
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 16),
                    itemCount: tickets.length,
                    itemBuilder: (context, index) {
                      final t = tickets[index];
                      final normalizedStatus =
                          t.status.toLowerCase().replaceAll('_', ' ');
                      final isResolved =
                          ['resolved', 'closed'].contains(normalizedStatus);
                      final title = t.type.isNotEmpty ? t.type : 'Sensor Issue';
                      final techLabel = t.technicianName ??
                          (t.technicianId == null
                              ? 'Waiting for admin assignment'
                              : 'Technician assigned');
                      final isAssigned = t.technicianId != null;
                      final statusLabel =
                          normalizedStatus == 'pending' ||
                                  normalizedStatus == 'open'
                              ? 'Awaiting admin assignment'
                              : _titleCase(normalizedStatus);
                      final statusColor =
                          _supportStatusColor(normalizedStatus);

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.02),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(14),
                          onTap: () => _openTicket(t),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      title,
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF0F172A),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Flexible(
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: statusColor.withValues(
                                            alpha: 0.12),
                                        borderRadius: BorderRadius.circular(999),
                                        border: Border.all(
                                          color: statusColor.withValues(
                                              alpha: 0.35),
                                        ),
                                      ),
                                      child: Text(
                                        statusLabel,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: statusColor,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                t.description.isNotEmpty
                                    ? t.description
                                    : t.issue,
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF334155),
                                ),
                              ),
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 12,
                                runSpacing: 6,
                                children: [
                                  _Meta(
                                    icon: isAssigned
                                        ? Icons.person_outline_rounded
                                        : Icons.admin_panel_settings_outlined,
                                    text: techLabel,
                                  ),
                                  _Meta(
                                    icon: Icons.flag_outlined,
                                    text: 'Priority: ${t.priority}',
                                  ),
                                  _Meta(
                                    icon: Icons.schedule,
                                    text: _formatDateTime(t.createdAt),
                                  ),
                                ],
                              ),
                              if (isResolved) ...[
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    const Icon(Icons.check_circle,
                                        size: 15, color: Color(0xFF15803D)),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        t.notes.isNotEmpty
                                            ? 'Resolved: ${t.notes}'
                                            : 'This ticket has been resolved.',
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                            fontSize: 12,
                                            color: Color(0xFF15803D)),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openCreateTicketScreen,
        backgroundColor: const Color(0xFF6366F1),
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: const Icon(Icons.add, size: 28),
      ),
    );
  }

  String _titleCase(String value) => value
      .split(' ')
      .map((word) => word.isEmpty
          ? word
          : '${word[0].toUpperCase()}${word.substring(1)}')
      .join(' ');
}

class _Meta extends StatelessWidget {
  const _Meta({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: const Color(0xFF64748B)),
        const SizedBox(width: 4),
        Text(text,
            style:
                const TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
      ],
    );
  }
}

class _TicketDetailScreen extends StatefulWidget {
  const _TicketDetailScreen({required this.repo, required this.ticket});

  final MobileRepository repo;
  final SupportTicket ticket;

  @override
  State<_TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<_TicketDetailScreen> {
  late SupportTicket _ticket = widget.ticket;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadLatest();
  }

  Future<void> _loadLatest() async {
    try {
      final latest = await widget.repo.fetchTicket(widget.ticket.id);
      if (mounted) setState(() => _ticket = latest);
    } catch (_) {
      // Keep showing the list data when the detail request fails.
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = _ticket.status.toLowerCase().replaceAll('_', ' ');
    final color = _supportStatusColor(status);
    final assigned = _ticket.technicianId != null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ticket details'),
        actions: [
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(14),
              child: SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: Colors.white),
              ),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadLatest,
        child: ListView(
          padding: const EdgeInsets.all(18),
          children: [
            Text(
              _ticket.type.isNotEmpty ? _ticket.type : 'Support ticket',
              style:
                  const TextStyle(fontSize: 23, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Flexible(
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      _titleCase(status),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: color),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text('Priority: ${_ticket.priority}',
                      textAlign: TextAlign.right,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 12, color: Color(0xFF64748B))),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _Timeline(status: status),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _DetailLabel('Description'),
                    Text(
                      _ticket.description.isNotEmpty
                          ? _ticket.description
                          : _ticket.issue,
                      style: const TextStyle(fontSize: 14, height: 1.4),
                    ),
                    if (_ticket.customerAddress.isNotEmpty) ...[
                      const SizedBox(height: 14),
                      const _DetailLabel('Service address'),
                      Text(_ticket.customerAddress,
                          style: const TextStyle(fontSize: 14)),
                    ],
                    const SizedBox(height: 14),
                    const _DetailLabel('Reported'),
                    Text(_formatDateTime(_ticket.createdAt),
                        style: const TextStyle(fontSize: 14)),
                    const SizedBox(height: 14),
                    const _DetailLabel('Technician'),
                    Text(
                      _ticket.technicianName ??
                          (assigned
                              ? 'Assigned technician'
                              : 'Waiting for admin assignment'),
                      style: const TextStyle(fontSize: 14),
                    ),
                    if (_ticket.assignedAt != null) ...[
                      const SizedBox(height: 4),
                      Text('Assigned ${_formatDateTime(_ticket.assignedAt!)}',
                          style: const TextStyle(
                              fontSize: 11.5, color: Color(0xFF64748B))),
                    ],
                  ],
                ),
              ),
            ),
            if (_ticket.progressNotes.isNotEmpty) ...[
              const SizedBox(height: 12),
              _NoteCard(
                title: 'Technician progress',
                body: _ticket.progressNotes,
                color: const Color(0xFF0284C7),
                icon: Icons.build_circle_outlined,
              ),
            ],
            if (_ticket.rejectionReason.isNotEmpty) ...[
              const SizedBox(height: 12),
              _NoteCard(
                title: 'Assignment was declined',
                body: _ticket.rejectionReason,
                color: const Color(0xFFDC2626),
                icon: Icons.report_gmailerrorred_outlined,
              ),
            ],
            if (_ticket.notes.isNotEmpty) ...[
              const SizedBox(height: 12),
              _NoteCard(
                title: 'Resolution notes',
                body: _ticket.notes,
                color: const Color(0xFF15803D),
                icon: Icons.check_circle_outline,
              ),
            ],
            if (_ticket.resolvedAt != null) ...[
              const SizedBox(height: 10),
              Text('Resolved ${_formatDateTime(_ticket.resolvedAt!)}',
                  style: const TextStyle(
                      fontSize: 11.5, color: Color(0xFF64748B))),
            ],
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'An administrator reviews every ticket. You will get a notification whenever the status changes.',
                style: TextStyle(fontSize: 12.5, color: Color(0xFF1E40AF)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Timeline extends StatelessWidget {
  const _Timeline({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    const steps = ['open', 'assigned', 'in progress', 'resolved'];
    final normalized = status == 'pending' ? 'open' : status;
    final current = steps.indexOf(normalized);
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
                      ? const Color(0xFF0284C7)
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
                        ? const Color(0xFF0284C7)
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

  String _titleCase(String value) => value
      .split(' ')
      .map((w) => w.isEmpty ? w : '${w[0].toUpperCase()}${w.substring(1)}')
      .join(' ');
}

class _NoteCard extends StatelessWidget {
  const _NoteCard({
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

class _CreateTicketScreen extends StatefulWidget {
  const _CreateTicketScreen({required this.onSubmit});
  final Future<void> Function(String type, String description) onSubmit;

  @override
  State<_CreateTicketScreen> createState() => _CreateTicketScreenState();
}

class _CreateTicketScreenState extends State<_CreateTicketScreen> {
  final _descController = TextEditingController();
  String? _selectedType;
  bool _submitting = false;

  final List<String> _issueTypes = [
    'Sensor Issue',
    'Leak Detection',
    'Valve Failure',
    'Water Quality Problem',
    'Meter Discrepancy',
    'Billing Inquiry',
    'Other Service Issue',
  ];

  Future<void> _submit() async {
    final desc = _descController.text.trim();
    if (desc.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content:
                Text('Please describe the issue you are experiencing.')),
      );
      return;
    }
    if (_selectedType == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select an issue type.')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      await widget.onSubmit(_selectedType!, desc);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ticket created successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to submit ticket: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  void dispose() {
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Create Support Ticket',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Color(0xFF0F172A),
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'Your request will go to the admin team. An admin will review it and choose the technician.',
                  style: TextStyle(color: Color(0xFF1E40AF), fontSize: 13),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Describe your issue',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF334155),
                ),
              ),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: TextField(
                  controller: _descController,
                  maxLines: 7,
                  decoration: const InputDecoration(
                    hintText:
                        "Provide detailed information about the issue you're experiencing...",
                    hintStyle: TextStyle(
                        color: Color(0xFF94A3B8), fontSize: 13),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.all(16),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Issue Type',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF334155),
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    isExpanded: true,
                    hint: const Text(
                      'Select Issue type',
                      style:
                          TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                    ),
                    value: _selectedType,
                    items: _issueTypes.map((type) {
                      return DropdownMenuItem(
                        value: type,
                        child:
                            Text(type, style: const TextStyle(fontSize: 14)),
                      );
                    }).toList(),
                    onChanged: (val) => setState(() => _selectedType = val),
                  ),
                ),
              ),
              const SizedBox(height: 36),
              ElevatedButton(
                onPressed: _submitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: _submitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Submit Ticket',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w700),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Color _supportStatusColor(String status) {
  switch (status.toLowerCase()) {
    case 'resolved':
    case 'closed':
      return const Color(0xFF15803D);
    case 'accepted':
    case 'in progress':
      return const Color(0xFF0284C7);
    case 'assigned':
      return const Color(0xFFD97706);
    case 'pending':
    case 'open':
      return const Color(0xFF64748B);
    default:
      return const Color(0xFF64748B);
  }
}

String _titleCase(String value) => value
    .split(' ')
    .map((word) => word.isEmpty
        ? word
        : '${word[0].toUpperCase()}${word.substring(1)}')
    .join(' ');

String _formatDateTime(String value) {
  if (value.isEmpty) return '—';
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return value;
  final d = parsed.toLocal();
  return '${d.day.toString().padLeft(2, '0')}/'
      '${d.month.toString().padLeft(2, '0')}/${d.year} '
      '${d.hour.toString().padLeft(2, '0')}:'
      '${d.minute.toString().padLeft(2, '0')}';
}
