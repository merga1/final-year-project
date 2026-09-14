import 'package:flutter/material.dart';
import '../models/mobile_repository.dart';

class BillsScreen extends StatefulWidget {
  const BillsScreen({super.key, required this.repo});
  final MobileRepository repo;

  @override
  State<BillsScreen> createState() => _BillsScreenState();
}

class _BillsScreenState extends State<BillsScreen> {
  late Future<List<Bill>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.repo.fetchBills();
  }

  Color _statusColor(String status) => switch (status) {
    'paid' => const Color(0xFF2E8B57),
    'overdue' => const Color(0xFF8B1E3F),
    _ => const Color(0xFF9C6B00),
  };

  IconData _statusIcon(String status) => switch (status) {
    'paid' => Icons.check_circle_outline,
    'overdue' => Icons.warning_amber_outlined,
    _ => Icons.schedule_outlined,
  };

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Bill>>(
      future: _future,
      builder: (ctx, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snap.hasError) {
          return Center(child: Text('${snap.error}'));
        }
        final bills = snap.data!;
        if (bills.isEmpty) {
          return const Center(child: Text('No bills found.'));
        }

        return RefreshIndicator(
          onRefresh: () async => setState(() => _future = widget.repo.fetchBills()),
          child: ListView(padding: const EdgeInsets.all(16), children: [
            Text('My Bills', style: Theme.of(ctx).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('${bills.length} bill(s) on record', style: TextStyle(color: Colors.grey[600])),
            const SizedBox(height: 16),
            ...bills.map((bill) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(padding: const EdgeInsets.all(16), child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Icon(_statusIcon(bill.status), color: _statusColor(bill.status), size: 18),
                    const SizedBox(width: 8),
                    Text('ETB ${bill.amountEtb.toStringAsFixed(0)}',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18,
                            color: _statusColor(bill.status))),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _statusColor(bill.status).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(bill.status.toUpperCase(),
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
                              color: _statusColor(bill.status))),
                    ),
                  ]),
                  const SizedBox(height: 8),
                  Text('${bill.periodStart} → ${bill.periodEnd}',
                      style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                  Text('Usage: ${bill.usageLiters.toStringAsFixed(0)} L  •  Due: ${bill.dueDate}',
                      style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                  if (bill.status == 'pending') ...[
                    const SizedBox(height: 12),
                    SizedBox(width: double.infinity, child: OutlinedButton.icon(
                      icon: const Icon(Icons.payment_outlined, size: 18),
                      label: const Text('Pay Now'),
                      onPressed: () => _showPayDialog(ctx, bill),
                    )),
                  ],
                ],
              )),
            )),
          ]),
        );
      },
    );
  }

  void _showPayDialog(BuildContext ctx, Bill bill) {
    showDialog(context: ctx, builder: (_) => AlertDialog(
      title: const Text('Pay Bill'),
      content: Text('Pay ETB ${bill.amountEtb.toStringAsFixed(0)} via Chappa mobile payment?'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
        FilledButton(onPressed: () {
          Navigator.pop(ctx);
          ScaffoldMessenger.of(ctx).showSnackBar(
            const SnackBar(content: Text('Payment submitted for verification')));
        }, child: const Text('Confirm')),
      ],
    ));
  }
}
