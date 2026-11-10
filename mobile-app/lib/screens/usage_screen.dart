import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../models/mobile_repository.dart';

class UsageScreen extends StatefulWidget {
  const UsageScreen({super.key, required this.repo});
  final MobileRepository repo;

  @override
  State<UsageScreen> createState() => _UsageScreenState();
}

class _UsageScreenState extends State<UsageScreen> {
  late Future<List<DailyUsage>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.repo.fetchDailyUsage();
  }

  Future<void> _refresh() async {
    setState(() => _future = widget.repo.fetchDailyUsage());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<DailyUsage>>(
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
                  const Icon(Icons.show_chart_rounded,
                      size: 48, color: Colors.grey),
                  const SizedBox(height: 10),
                  Text('Could not load usage: ${snap.error}',
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

        final data = snap.data ?? [];
        if (data.isEmpty) {
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              children: const [
                SizedBox(height: 140),
                Icon(Icons.insights_outlined,
                    size: 52, color: Color(0xFF94A3B8)),
                SizedBox(height: 12),
                Center(
                  child: Text(
                    'No usage data yet.\nReadings appear here once your meter starts reporting.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Color(0xFF64748B)),
                  ),
                ),
              ],
            ),
          );
        }

        final spots = data
            .asMap()
            .entries
            .map((e) => FlSpot(e.key.toDouble(), e.value.usageLiters))
            .toList();
        final total = data.fold<double>(0, (s, d) => s + d.usageLiters);
        final avg = total / data.length;
        final peak = data.reduce(
            (a, b) => b.usageLiters > a.usageLiters ? b : a);
        final estimatedMonth = avg * 30;
        final anomalies = avg > 0
            ? data.where((d) => d.usageLiters > avg * 2).toList()
            : <DailyUsage>[];
        final maxUsage = data
            .map((d) => d.usageLiters)
            .fold<double>(0, (m, v) => v > m ? v : m);
        final chartMaxY = maxUsage <= 0 ? 10.0 : maxUsage * 1.25;

        return RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text(
                'Usage Analytics',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text('Last ${data.length} days • liters per day',
                  style: const TextStyle(color: Color(0xFF64748B))),
              const SizedBox(height: 18),
              Row(children: [
                _StatChip(
                    label: 'Total used',
                    value: '${total.toStringAsFixed(0)} L'),
                const SizedBox(width: 10),
                _StatChip(
                    label: 'Daily average',
                    value: '${avg.toStringAsFixed(0)} L'),
              ]),
              const SizedBox(height: 10),
              Row(children: [
                _StatChip(
                    label: 'Estimated month',
                    value: '${estimatedMonth.toStringAsFixed(0)} L'),
                const SizedBox(width: 10),
                _StatChip(
                    label: 'Peak day',
                    value: '${peak.usageLiters.toStringAsFixed(0)} L'),
              ]),
              const SizedBox(height: 20),
              Card(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Daily usage trend',
                        style: TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        height: 210,
                        child: LineChart(
                          LineChartData(
                            minY: 0,
                            maxY: chartMaxY,
                            gridData: FlGridData(
                              show: true,
                              drawVerticalLine: false,
                              getDrawingHorizontalLine: (_) => FlLine(
                                  color: const Color(0xFFE2E8F0),
                                  strokeWidth: 1),
                            ),
                            titlesData: FlTitlesData(
                              leftTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  reservedSize: 52,
                                  getTitlesWidget: (v, _) => Text(
                                    '${v.toInt()}L',
                                    style: const TextStyle(fontSize: 10),
                                  ),
                                ),
                              ),
                              bottomTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  reservedSize: 26,
                                  getTitlesWidget: (v, _) {
                                    final i = v.toInt();
                                    if (i < 0 || i >= data.length) {
                                      return const SizedBox.shrink();
                                    }
                                    final day = data[i].day;
                                    return Text(
                                      day.length >= 5
                                          ? day.substring(5)
                                          : day,
                                      style: const TextStyle(fontSize: 10),
                                    );
                                  },
                                ),
                              ),
                              rightTitles: const AxisTitles(
                                  sideTitles:
                                      SideTitles(showTitles: false)),
                              topTitles: const AxisTitles(
                                  sideTitles:
                                      SideTitles(showTitles: false)),
                            ),
                            borderData: FlBorderData(show: false),
                            lineBarsData: [
                              LineChartBarData(
                                spots: spots,
                                isCurved: true,
                                color: const Color(0xFF0284C7),
                                barWidth: 2.5,
                                dotData: const FlDotData(show: true),
                                belowBarData: BarAreaData(
                                  show: true,
                                  color: const Color(0xFF0284C7)
                                      .withValues(alpha: 0.12),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              if (anomalies.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFCD34D)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.warning_amber_rounded,
                          color: Color(0xFFD97706), size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Possible leak or unusual usage on '
                          '${anomalies.map((d) => d.day).join(', ')}. '
                          'Each of these days used more than twice your average. '
                          'Check your taps and consider raising a support ticket.',
                          style: const TextStyle(
                              fontSize: 12.5, color: Color(0xFF92400E)),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
              const Text(
                'Daily breakdown',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Card(
                child: Column(
                  children: [
                    for (var i = 0; i < data.length; i++) ...[
                      _DayRow(
                        day: data[i].day,
                        liters: data[i].usageLiters,
                        maxLiters: maxUsage,
                      ),
                      if (i != data.length - 1) const Divider(height: 1),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.label, required this.value});
  final String label, value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label,
              style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
          const SizedBox(height: 4),
          Text(value,
              style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 17,
                  color: Color(0xFF0284C7))),
        ]),
      ),
    );
  }
}

class _DayRow extends StatelessWidget {
  const _DayRow({
    required this.day,
    required this.liters,
    required this.maxLiters,
  });

  final String day;
  final double liters;
  final double maxLiters;

  @override
  Widget build(BuildContext context) {
    final fraction = maxLiters <= 0 ? 0.0 : (liters / maxLiters).clamp(0.0, 1.0);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: Row(
        children: [
          SizedBox(
            width: 54,
            child: Text(
              day.length >= 5 ? day.substring(5) : day,
              style: const TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                value: fraction,
                minHeight: 7,
                backgroundColor: const Color(0xFFF1F5F9),
                valueColor: const AlwaysStoppedAnimation(Color(0xFF0284C7)),
              ),
            ),
          ),
          const SizedBox(width: 10),
          SizedBox(
            width: 64,
            child: Text(
              '${liters.toStringAsFixed(0)} L',
              textAlign: TextAlign.right,
              style: const TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}
