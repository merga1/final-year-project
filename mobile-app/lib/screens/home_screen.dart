import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../models/mobile_home_data.dart';
import '../models/mobile_repository.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.repo, this.onNavigate});
  final MobileRepository repo;

  /// Switches the parent shell to another bottom-navigation tab.
  final ValueChanged<int>? onNavigate;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late Future<MobileHomeData> _future;
  bool? _valveOverride;
  bool _togglingValve = false;

  @override
  void initState() {
    super.initState();
    _future = widget.repo.fetchHome();
  }

  Future<void> _refresh() async {
    setState(() {
      _future = widget.repo.fetchHome();
      _valveOverride = null;
    });
    await _future;
  }

  Future<void> _handleValveToggle(bool currentOpen) async {
    if (_togglingValve) return;
    final nextOpen = !currentOpen;
    final nextState = nextOpen ? 'OPEN' : 'CLOSED';

    if (!nextOpen) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Close the valve?'),
          content: const Text('Closing the valve stops water flow for this device. Continue?'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Close valve')),
          ],
        ),
      );
      if (confirmed != true) return;
    }

    setState(() => _togglingValve = true);

    // Optimistic UI update
    setState(() => _valveOverride = nextOpen);

    try {
      await widget.repo.toggleValve(nextState);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Valve remotely ${nextOpen ? 'OPENED' : 'CLOSED'}'),
            duration: const Duration(seconds: 2),
            backgroundColor: nextOpen ? const Color(0xFF10B981) : const Color(0xFFEF4444),
          ),
        );
      }
    } catch (e) {
      // Revert optimistic update on failure
      if (mounted) {
        setState(() => _valveOverride = currentOpen);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to toggle valve: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _togglingValve = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<MobileHomeData>(
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
                  const Icon(Icons.wifi_off_outlined,
                      size: 48, color: Colors.grey),
                  const SizedBox(height: 12),
                  Text('${snap.error}',
                      textAlign: TextAlign.center,
                      style: Theme.of(ctx).textTheme.bodySmall),
                  const SizedBox(height: 8),
                  Text(
                    'Active: ${ApiConstants.baseUrl}',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E6B52)),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    alignment: WrapAlignment.center,
                    children: [
                      FilledButton.icon(
                        onPressed: _refresh,
                        icon: const Icon(Icons.refresh, size: 16),
                        label: const Text('Retry'),
                      ),
                      OutlinedButton.icon(
                        onPressed: () async {
                          await ApiConstants.setBaseUrl(
                              ApiConstants.defaultLocalUrl);
                          _refresh();
                        },
                        icon: const Icon(Icons.usb, size: 16),
                        label: const Text('USB (127.0.0.1)'),
                      ),
                      OutlinedButton.icon(
                        onPressed: () async {
                          await ApiConstants.setBaseUrl(
                              ApiConstants.defaultWifiUrl);
                          _refresh();
                        },
                        icon: const Icon(Icons.wifi, size: 16),
                        label: const Text('Wi-Fi (192.168.11.137)'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF1E6B52),
                          side: const BorderSide(color: Color(0xFF1E6B52)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        }

        final home = snap.data!;
        final hasMeter = home.meterId.isNotEmpty && home.meterId != 'Not assigned';
        if (!hasMeter) {
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const SizedBox(height: 24),
                const Icon(Icons.water_drop_outlined,
                    size: 56, color: Color(0xFF0284C7)),
                const SizedBox(height: 16),
                Text(
                  'Welcome, ${home.customerName}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontSize: 23, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 12),
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(18),
                    child: Column(
                      children: [
                        Text(
                          'No water meter is linked to your account yet.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w700),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Your meter request is available in Support Tickets. Once a meter is assigned, readings, water quality, and valve controls will appear here.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.badge_outlined,
                        color: Color(0xFF0284C7)),
                    title: const Text('Customer information'),
                    subtitle: Text(home.customerEmail),
                  ),
                ),
              ],
            ),
          );
        }
        final isValveOpen = _valveOverride ?? (home.valveState == 'OPEN');
        final isOffline = home.deviceOffline || home.connectionStatus.toUpperCase() == 'OFFLINE';

        return RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            children: [
              // Greeting and live status
              Text(
                'Hello, ${home.customerName.split(' ').first}',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Meter ${home.meterId} • ${home.zone}',
                style: const TextStyle(fontSize: 12.5, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Icon(isOffline ? Icons.cloud_off_outlined : Icons.cloud_done_outlined, size: 15, color: isOffline ? Colors.orange : Colors.green),
                  const SizedBox(width: 5),
                  Flexible(
                    child: Text(
                      isOffline ? 'Showing last known readings' : 'Live sensor readings',
                      style: TextStyle(fontSize: 12, color: isOffline ? Colors.orange[800] : Colors.green[800], fontWeight: FontWeight.w600),
                    ),
                  ),
                  if (home.lastUpdatedAt != null) ...[
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text('Updated ${_formatTimestamp(home.lastUpdatedAt!)}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 20),

              // 2x2 Grid matching screenshot
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 0.84,
                children: [
                  // 1. Flow Rate Card
                  _SensorGridCard(
                    iconBg: const Color(0xFFE0F2FE),
                    iconColor: const Color(0xFF0284C7),
                    icon: Icons.water_drop_rounded,
                    title: 'Flow Rate',
                    value: home.flowRateLpm.toStringAsFixed(1),
                    unit: 'L/min',
                  ),

                  // 2. Turbidity Level Card
                  _SensorGridCard(
                    iconBg: const Color(0xFFFEF3C7),
                    iconColor: const Color(0xFFD97706),
                    icon: Icons.science_rounded,
                    title: 'Turbidity Level',
                    value: home.turbidityNtu.toStringAsFixed(1),
                    unit: 'NTU',
                  ),

                  // 3. Monthly Consumption Card
                  _SensorGridCard(
                    iconBg: const Color(0xFFEDE9FE),
                    iconColor: const Color(0xFF7C3AED),
                    icon: Icons.speed_rounded,
                    title: 'Monthly Consumption',
                    value: home.monthlyConsumptionLiters > 0
                        ? home.monthlyConsumptionLiters.toStringAsFixed(0)
                        : '...',
                    unit: 'liters',
                  ),

                  // 4. Valve Control Card with interactive Switch
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
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
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: const Color(0xFFD1FAE5),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.power_settings_new_rounded,
                            color: Color(0xFF059669),
                            size: 24,
                          ),
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Valve Control',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF475569),
                          ),
                        ),
                        const SizedBox(height: 12),
                        GestureDetector(
                          onTap: isOffline || _togglingValve ? null : () => _handleValveToggle(isValveOpen),
                          child: Container(
                            width: 50,
                            height: 28,
                            padding: const EdgeInsets.all(3),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(999),
                               color: isOffline ? const Color(0xFFCBD5E1) : isValveOpen
                                  ? const Color(0xFF10B981)
                                  : const Color(0xFFEF4444),
                            ),
                            child: AnimatedAlign(
                              duration: const Duration(milliseconds: 200),
                              alignment: isValveOpen
                                  ? Alignment.centerRight
                                  : Alignment.centerLeft,
                              child: Container(
                                width: 22,
                                height: 22,
                                decoration: const BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const _SectionHeader('Quick actions'),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _QuickAction(
                      icon: Icons.receipt_long_outlined,
                      label: 'Pay bill',
                      color: const Color(0xFF7C3AED),
                      onTap: widget.onNavigate == null
                          ? null
                          : () => widget.onNavigate!(2),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _QuickAction(
                      icon: Icons.insights_outlined,
                      label: 'View usage',
                      color: const Color(0xFF0284C7),
                      onTap: widget.onNavigate == null
                          ? null
                          : () => widget.onNavigate!(1),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _QuickAction(
                      icon: Icons.support_agent_outlined,
                      label: 'Raise ticket',
                      color: const Color(0xFFD97706),
                      onTap: widget.onNavigate == null
                          ? null
                          : () => widget.onNavigate!(3),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _QualityCard(
                status: home.waterQualityStatus,
                advice: home.waterQualityAdvice,
                turbidity: home.turbidityNtu,
              ),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _InfoTile(
                      icon: Icons.today_outlined,
                      label: 'Today',
                      value: '${home.dailyConsumptionLiters.toStringAsFixed(0)} L',
                      caption: 'Used since midnight',
                      color: const Color(0xFF0284C7),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _InfoTile(
                      icon: Icons.account_balance_wallet_outlined,
                      label: 'Outstanding',
                      value: home.outstandingBillEtb > 0
                          ? 'ETB ${home.outstandingBillEtb.toStringAsFixed(2)}'
                          : 'Paid up',
                      caption: home.outstandingBillCount > 0
                          ? '${home.outstandingBillCount} unpaid bill(s)'
                          : 'No pending bills',
                      color: home.outstandingBillEtb > 0
                          ? const Color(0xFFDC2626)
                          : const Color(0xFF15803D),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const _SectionHeader('Recent alerts'),
              const SizedBox(height: 8),
              if (home.alerts.isEmpty)
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.check_circle_outline,
                          size: 18, color: Color(0xFF15803D)),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'No active alerts. We will notify you if the meter reports a problem.',
                          style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B)),
                        ),
                      ),
                    ],
                  ),
                )
              else
                ...home.alerts.take(5).map((alert) => _AlertTile(message: alert)),
            ],
          ),
        );
      },
    );
  }

  String _formatTimestamp(String value) {
    final parsed = DateTime.tryParse(value);
    if (parsed == null) return value;
    final local = parsed.toLocal();
    return '${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
  }
}

class _SensorGridCard extends StatelessWidget {
  const _SensorGridCard({
    required this.iconBg,
    required this.iconColor,
    required this.icon,
    required this.title,
    required this.value,
    required this.unit,
  });

  final Color iconBg;
  final Color iconColor;
  final IconData icon;
  final String title;
  final String value;
  final String unit;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
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
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFF475569),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
          Text(
            unit,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w800,
        color: Color(0xFF0F172A),
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.caption,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final String caption;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
                fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
                fontSize: 17, fontWeight: FontWeight.w800, color: color),
          ),
          const SizedBox(height: 2),
          Text(
            caption,
            style: const TextStyle(fontSize: 10.5, color: Color(0xFF94A3B8)),
          ),
        ],
      ),
    );
  }
}

class _QualityCard extends StatelessWidget {
  const _QualityCard({
    required this.status,
    required this.advice,
    required this.turbidity,
  });

  final String status;
  final String advice;
  final double turbidity;

  @override
  Widget build(BuildContext context) {
    final normalized = status.toLowerCase();
    final isSafe = normalized == 'safe';
    final isUnknown = normalized == 'unknown';
    final color = isUnknown
        ? const Color(0xFF64748B)
        : isSafe
            ? const Color(0xFF15803D)
            : normalized == 'warning'
                ? const Color(0xFFD97706)
                : const Color(0xFFDC2626);
    final background = isUnknown
        ? const Color(0xFFF1F5F9)
        : isSafe
            ? const Color(0xFFDCFCE7)
            : normalized == 'warning'
                ? const Color(0xFFFEF3C7)
                : const Color(0xFFFEE2E2);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.7),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.water_drop_outlined, color: color, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        'Water quality: ${isUnknown ? 'No reading' : status}',
                        style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: color),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${turbidity.toStringAsFixed(1)} NTU',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: color),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  advice.isEmpty
                      ? 'Water quality is measured from the latest turbidity reading.'
                      : advice,
                  style: const TextStyle(
                      fontSize: 12, height: 1.35, color: Color(0xFF334155)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(11),
              ),
              child: Icon(icon, size: 20, color: color),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF334155)),
            ),
          ],
        ),
      ),
    );
  }
}

class _AlertTile extends StatelessWidget {
  const _AlertTile({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.warning_amber_rounded,
              size: 18, color: Color(0xFFD97706)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(fontSize: 12.5, color: Color(0xFF334155)),
            ),
          ),
        ],
      ),
    );
  }
}
