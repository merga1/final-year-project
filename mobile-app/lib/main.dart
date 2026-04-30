import 'package:flutter/material.dart';

import 'models/mobile_home_data.dart';
import 'services/home_repository.dart';

void main() {
  runApp(const SmartWaterApp());
}

class SmartWaterApp extends StatelessWidget {
  const SmartWaterApp({
    super.key,
    this.repository,
  });

  final HomeRepository? repository;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smart Water',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0D5C91)),
        useMaterial3: true,
      ),
      home: CustomerHomePage(
        repository: repository ?? ApiHomeRepository(),
      ),
    );
  }
}

class CustomerHomePage extends StatefulWidget {
  const CustomerHomePage({
    super.key,
    required this.repository,
  });

  final HomeRepository repository;

  @override
  State<CustomerHomePage> createState() => _CustomerHomePageState();
}

class _CustomerHomePageState extends State<CustomerHomePage> {
  late Future<MobileHomeData> _homeFuture;

  @override
  void initState() {
    super.initState();
    _homeFuture = widget.repository.fetchHomeDashboard();
  }

  Future<void> _refresh() async {
    setState(() {
      _homeFuture = widget.repository.fetchHomeDashboard();
    });

    await _homeFuture;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Smart Water'),
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.notifications_none_outlined),
          ),
        ],
      ),
      body: FutureBuilder<MobileHomeData>(
        future: _homeFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Unable to load live data from the backend.',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${snapshot.error}',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: _refresh,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }

          final home = snapshot.data!;

          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'Welcome, ${home.customerName}',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 6),
                Text(
                  'Meter ${home.meterId} • ${home.connectionStatus}',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                ...home.cards.expand(
                  (card) => [
                    _StatusCard(
                      title: card.title,
                      value: card.value,
                      subtitle: card.subtitle,
                      color: _toneToColor(card.tone),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
                if (home.alerts.isNotEmpty) ...[
                  Text(
                    'Recent Alerts',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  ...home.alerts.map(
                    (alert) => Card(
                      child: ListTile(
                        leading: const Icon(Icons.info_outline),
                        title: Text(alert),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: 0,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.water_drop_outlined), label: 'Usage'),
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), label: 'Bills'),
          NavigationDestination(icon: Icon(Icons.support_agent_outlined), label: 'Support'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }

  Color _toneToColor(StatusTone tone) {
    switch (tone) {
      case StatusTone.success:
        return const Color(0xFF2E8B57);
      case StatusTone.info:
        return const Color(0xFF0D5C91);
      case StatusTone.warning:
        return const Color(0xFF9C6B00);
      case StatusTone.danger:
        return const Color(0xFF8B1E3F);
    }
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.color,
  });

  final String title;
  final String value;
  final String subtitle;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: color,
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 4),
            Text(subtitle),
          ],
        ),
      ),
    );
  }
}
