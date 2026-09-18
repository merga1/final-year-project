import 'package:flutter/material.dart';
import '../models/mobile_home_data.dart';
import '../models/mobile_repository.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.repo});
  final MobileRepository repo;

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
    setState(() => _togglingValve = true);

    final nextOpen = !currentOpen;
    final nextState = nextOpen ? 'OPEN' : 'CLOSED';

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
                  const SizedBox(height: 16),
                  FilledButton(
                      onPressed: _refresh, child: const Text('Retry')),
                ],
              ),
            ),
          );
        }

        final home = snap.data!;
        final isValveOpen = _valveOverride ?? (home.valveState == 'OPEN');

        return RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            children: [
              // Top status banner
              Center(
                child: Text(
                  'Connecting to sensor data...',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[500],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // 2x2 Grid matching screenshot
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 0.95,
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
                          onTap: () => _handleValveToggle(isValveOpen),
                          child: Container(
                            width: 50,
                            height: 28,
                            padding: const EdgeInsets.all(3),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(999),
                              color: isValveOpen
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
            ],
          ),
        );
      },
    );
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
