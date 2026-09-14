import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
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

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<DailyUsage>>(
      future: _future,
      builder: (ctx, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snap.hasError) {
          return Center(child: Text('${snap.error}'));
        }

        final data = snap.data!;
        if (data.isEmpty) {
          return const Center(child: Text('No usage data yet.'));
        }

        final spots = data.asMap().entries.map((e) =>
            FlSpot(e.key.toDouble(), e.value.usageLiters)).toList();
        final total = data.fold(0.0, (s, d) => s + d.usageLiters);
        final avg = total / data.length;

        return RefreshIndicator(
          onRefresh: () async => setState(() => _future = widget.repo.fetchDailyUsage()),
          child: ListView(padding: const EdgeInsets.all(16), children: [
            Text('Usage Analytics', style: Theme.of(ctx).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('Last ${data.length} days', style: TextStyle(color: Colors.grey[600])),
            const SizedBox(height: 20),
            Row(children: [
              _StatChip(label: 'Total', value: '${total.toStringAsFixed(0)} L'),
              const SizedBox(width: 12),
              _StatChip(label: 'Daily Avg', value: '${avg.toStringAsFixed(0)} L'),
            ]),
            const SizedBox(height: 20),
            Card(child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('7-Day Usage Trend', style: Theme.of(ctx).textTheme.titleMedium),
                const SizedBox(height: 16),
                SizedBox(height: 200, child: LineChart(LineChartData(
                  gridData: FlGridData(show: true, drawVerticalLine: false,
                      getDrawingHorizontalLine: (_) => FlLine(color: Colors.grey[200]!, strokeWidth: 1)),
                  titlesData: FlTitlesData(
                    leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 50,
                        getTitlesWidget: (v, _) => Text('${v.toInt()}L', style: const TextStyle(fontSize: 10)))),
                    bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 24,
                        getTitlesWidget: (v, _) {
                          final i = v.toInt();
                          if (i >= data.length) return const SizedBox.shrink();
                          final day = data[i].day.substring(5); // MM-DD
                          return Text(day, style: const TextStyle(fontSize: 10));
                        })),
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    color: const Color(0xFF0D5C91),
                    barWidth: 2.5,
                    dotData: const FlDotData(show: true),
                    belowBarData: BarAreaData(show: true,
                        color: const Color(0xFF0D5C91).withValues(alpha: 0.1)),
                  )],
                ))),
              ]),
            )),
          ]),
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
    return Expanded(child: Card(color: const Color(0xFFE8F1F5), child: Padding(
      padding: const EdgeInsets.all(12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0D5C91))),
      ]),
    )));
  }
}
