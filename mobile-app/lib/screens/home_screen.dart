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

  @override
  void initState() {
    super.initState();
    _future = widget.repo.fetchHome();
  }

  Future<void> _refresh() async {
    setState(() => _future = widget.repo.fetchHome());
    await _future;
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
          return Center(child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.wifi_off_outlined, size: 48, color: Colors.grey),
              const SizedBox(height: 12),
              Text('${snap.error}', textAlign: TextAlign.center,
                  style: Theme.of(ctx).textTheme.bodySmall),
              const SizedBox(height: 16),
              FilledButton(onPressed: _refresh, child: const Text('Retry')),
            ]),
          ));
        }

        final home = snap.data!;
        return RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(padding: const EdgeInsets.all(16), children: [
            Text('Welcome, ${home.customerName}',
                style: Theme.of(ctx).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Row(children: [
              Icon(home.connectionStatus == 'ONLINE' ? Icons.circle : Icons.circle_outlined,
                  size: 10,
                  color: home.connectionStatus == 'ONLINE' ? Colors.green : Colors.red),
              const SizedBox(width: 6),
              Text('Meter ${home.meterId} • ${home.connectionStatus}',
                  style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(color: Colors.grey[600])),
            ]),
            const SizedBox(height: 16),
            ...home.cards.expand((card) => [
              _StatusCard(title: card.title, value: card.value,
                  subtitle: card.subtitle, tone: card.tone),
              const SizedBox(height: 12),
            ]),
            if (home.alerts.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text('Alerts', style: Theme.of(ctx).textTheme.titleMedium),
              const SizedBox(height: 8),
              ...home.alerts.map((a) => Card(
                child: ListTile(
                  leading: const Icon(Icons.info_outline, color: Color(0xFF0D5C91)),
                  title: Text(a),
                ),
              )),
            ],
          ]),
        );
      },
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({required this.title, required this.value, required this.subtitle, required this.tone});
  final String title, value, subtitle;
  final StatusTone tone;

  Color get _color => switch (tone) {
    StatusTone.success => const Color(0xFF2E8B57),
    StatusTone.info    => const Color(0xFF0D5C91),
    StatusTone.warning => const Color(0xFF9C6B00),
    StatusTone.danger  => const Color(0xFF8B1E3F),
  };

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(padding: const EdgeInsets.all(16), child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(value, style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: _color, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(subtitle, style: TextStyle(color: Colors.grey[600])),
        ],
      )),
    );
  }
}
