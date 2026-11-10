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

  Future<void> _refresh() async {
    setState(() => _future = widget.repo.fetchBills());
    await _future;
  }

  void _showChapaDialog(Bill bill) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.payment_rounded, color: Color(0xFF7C3AED)),
            SizedBox(width: 8),
            Text(
              'Pay with Chapa',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'You will be redirected to the secure Chapa gateway to complete your payment.',
              style: TextStyle(fontSize: 13, color: Color(0xFF475569)),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF3E8FF),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total Due:',
                      style: TextStyle(fontWeight: FontWeight.w600)),
                  Flexible(
                    child: Text(
                      'ETB ${bill.amountEtb.toStringAsFixed(2)}',
                      textAlign: TextAlign.right,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 18,
                        color: Color(0xFF7C3AED),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF7C3AED),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () async {
              try {
                final response = await widget.repo.payWithChapa(bill);
                if (ctx.mounted) Navigator.pop(ctx);
                if (mounted) {
                  final checkout = response['checkoutUrl'];
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(checkout is String && checkout.isNotEmpty
                          ? 'Chapa checkout is ready. Complete it in your browser.'
                          : 'Payment saved as pending. It will update after Chapa confirms it.'),
                      backgroundColor: const Color(0xFF059669),
                    ),
                  );
                  _refresh();
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                      content: Text('Payment could not be started: $e')));
                }
              }
            },
            child: const Text('Proceed to Pay'),
          ),
        ],
      ),
    );
  }

  Future<void> _showPaymentHistory() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (sheetContext) => SizedBox(
        height: MediaQuery.of(sheetContext).size.height * 0.75,
        child: FutureBuilder<List<PaymentRecord>>(
          future: widget.repo.fetchPayments(),
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text('Could not load payment history: ${snapshot.error}',
                      textAlign: TextAlign.center),
                ),
              );
            }
            final payments = snapshot.data ?? [];
            if (payments.isEmpty) {
              return const Center(
                child: Text('No payments recorded yet.',
                    style: TextStyle(color: Color(0xFF64748B))),
              );
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20),
                  child: Text('Payment history',
                      style: TextStyle(
                          fontSize: 18, fontWeight: FontWeight.w800)),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: payments.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final p = payments[i];
                      final color = _paymentStatusColor(p.status);
                      return Card(
                        margin: EdgeInsets.zero,
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: color.withValues(alpha: 0.12),
                            child: Icon(Icons.receipt_long_outlined,
                                color: color, size: 20),
                          ),
                          title: Text('ETB ${p.amount.toStringAsFixed(2)}',
                              style: const TextStyle(
                                  fontWeight: FontWeight.w700)),
                          subtitle: Text(
                            '${_titleCase(p.status)} • ${_titleCase(p.method)}\n'
                            'Ref: ${p.reference} • ${_formatDateTime(p.createdAt)}',
                            style: const TextStyle(fontSize: 11.5),
                          ),
                          isThreeLine: true,
                        ),
                      );
                    },
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Bill>>(
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
                  const Icon(Icons.receipt_long_outlined,
                      size: 48, color: Colors.grey),
                  const SizedBox(height: 10),
                  Text('Could not load your bills: ${snap.error}',
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

        final bills = snap.data ?? [];
        if (bills.isEmpty) {
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              children: const [
                SizedBox(height: 140),
                Icon(Icons.receipt_long_outlined,
                    size: 52, color: Color(0xFF94A3B8)),
                SizedBox(height: 12),
                Center(
                  child: Text(
                    'No bills have been issued yet.\nYour monthly bill will appear here.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Color(0xFF64748B)),
                  ),
                ),
              ],
            ),
          );
        }

        final unpaid = bills
            .where((b) =>
                b.status == 'pending' || b.status == 'overdue')
            .toList();
        final current = unpaid.isNotEmpty ? unpaid.first : bills.first;
        final totalUnpaid = unpaid.fold<double>(0, (s, b) => s + b.amountEtb);
        final isPaid = current.status == 'paid';

        return RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Current Bill',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  _StatusChip(status: current.status),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    _buildBillRow(
                      'Billing period',
                      '${_formatDate(current.periodStart)} – ${_formatDate(current.periodEnd)}',
                    ),
                    const Divider(height: 20, color: Color(0xFFF1F5F9)),
                    _buildBillRow('Due date', _formatDate(current.dueDate)),
                    const Divider(height: 20, color: Color(0xFFF1F5F9)),
                    _buildBillRow('Water used',
                        '${current.usageLiters.toStringAsFixed(2)} L'),
                    const Divider(height: 20, color: Color(0xFFF1F5F9)),
                    _buildBillRow(
                        'Rate', 'ETB ${current.rate.toStringAsFixed(2)}/L'),
                    if (unpaid.length > 1) ...[
                      const Divider(height: 20, color: Color(0xFFF1F5F9)),
                      _buildBillRow('Unpaid bills', '${unpaid.length} months'),
                      const Divider(height: 20, color: Color(0xFFF1F5F9)),
                      _buildBillRow('Total unpaid',
                          'ETB ${totalUnpaid.toStringAsFixed(2)}'),
                    ],
                    const Divider(height: 24, color: Color(0xFFE2E8F0)),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total Amount Due',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        Flexible(
                          child: Text(
                            isPaid
                                ? 'ETB ${current.amountEtb.toStringAsFixed(2)} paid'
                                : 'ETB ${current.amountEtb.toStringAsFixed(2)}',
                            textAlign: TextAlign.right,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: isPaid
                                  ? const Color(0xFF15803D)
                                  : const Color(0xFF7C3AED),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              const Text(
                'Detailed Breakdown',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 12),
              for (final bill in bills) ...[
                _buildBreakdownCard(bill),
                const SizedBox(height: 10),
              ],
              const SizedBox(height: 18),
              const Text(
                'Payment Methods',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed:
                    isPaid ? null : () => _showChapaDialog(current),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7C3AED),
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: const Color(0xFFE2E8F0),
                  disabledForegroundColor: const Color(0xFF64748B),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  elevation: 0,
                ),
                icon: Icon(
                    isPaid ? Icons.check_circle_outline : Icons.payment_rounded,
                    size: 20),
                label: Text(
                  isPaid ? 'Bill paid' : 'Pay with Chapa',
                  style: const TextStyle(
                      fontSize: 15, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  'Other payment methods coming soon',
                  style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                ),
              ),
              const SizedBox(height: 14),
              Center(
                child: TextButton.icon(
                  onPressed: _showPaymentHistory,
                  icon: const Icon(Icons.history_rounded, size: 16),
                  label: const Text(
                    'VIEW PAYMENT HISTORY',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.5,
                      color: Color(0xFF0284C7),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }

  Widget _buildBillRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            color: Color(0xFF64748B),
            fontWeight: FontWeight.w500,
          ),
        ),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF0F172A),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBreakdownCard(Bill bill) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Month of: ${_monthLabel(bill.periodStart)}',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E293B),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              _StatusChip(status: bill.status, compact: true),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Text(
                  'Water used: ${bill.usageLiters.toStringAsFixed(0)} L',
                  style: const TextStyle(
                      fontSize: 12, color: Color(0xFF64748B)),
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  'Charge: ETB ${bill.amountEtb.toStringAsFixed(2)}',
                  textAlign: TextAlign.right,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _monthLabel(String value) {
    final parsed = DateTime.tryParse(value);
    if (parsed == null) return value;
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return '${months[parsed.month - 1]} ${parsed.year}';
  }

  String _formatDate(String value) {
    if (value.isEmpty) return '—';
    final parsed = DateTime.tryParse(value);
    if (parsed == null) return value;
    final d = parsed.toLocal();
    return '${d.day.toString().padLeft(2, '0')}/'
        '${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  String _formatDateTime(String value) {
    if (value.isEmpty) return '—';
    final parsed = DateTime.tryParse(value);
    if (parsed == null) return value;
    final d = parsed.toLocal();
    return '${_formatDate(value)} ${d.hour.toString().padLeft(2, '0')}:'
        '${d.minute.toString().padLeft(2, '0')}';
  }

  Color _paymentStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'verified':
        return const Color(0xFF15803D);
      case 'failed':
      case 'disputed':
        return const Color(0xFFDC2626);
      default:
        return const Color(0xFFD97706);
    }
  }

  String _titleCase(String value) => value
      .replaceAll('_', ' ')
      .split(' ')
      .map((w) => w.isEmpty ? w : '${w[0].toUpperCase()}${w.substring(1)}')
      .join(' ');
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status, this.compact = false});

  final String status;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final normalized = status.toLowerCase();
    final color = normalized == 'paid'
        ? const Color(0xFF15803D)
        : normalized == 'overdue'
            ? const Color(0xFFDC2626)
            : normalized == 'cancelled'
                ? const Color(0xFF64748B)
                : const Color(0xFFD97706);
    final background = normalized == 'paid'
        ? const Color(0xFFDCFCE7)
        : normalized == 'overdue'
            ? const Color(0xFFFEE2E2)
            : normalized == 'cancelled'
                ? const Color(0xFFF1F5F9)
                : const Color(0xFFFEF3C7);
    return Container(
      padding: EdgeInsets.symmetric(
          horizontal: compact ? 8 : 12, vertical: compact ? 2 : 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        _titleCase(normalized),
        style: TextStyle(
            fontSize: compact ? 10 : 11,
            fontWeight: FontWeight.w700,
            color: color),
      ),
    );
  }

  String _titleCase(String value) => value
      .split(' ')
      .map((w) => w.isEmpty ? w : '${w[0].toUpperCase()}${w.substring(1)}')
      .join(' ');
}
