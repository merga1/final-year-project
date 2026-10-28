import 'package:flutter/material.dart';
import '../models/mobile_repository.dart';

class FieldJobsScreen extends StatefulWidget {
  const FieldJobsScreen({super.key, required this.repo});
  final MobileRepository repo;

  @override
  State<FieldJobsScreen> createState() => _FieldJobsScreenState();
}

class _FieldJobsScreenState extends State<FieldJobsScreen> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.repo.fetchMyJobs();
  }

  Future<void> _act(String id, String action) async {
    final body = action == 'complete'
        ? {
            'note': 'Visit completed',
            'evidenceNote': 'Checked on site',
            'manualReading': 18500,
          }
        : <String, dynamic>{};
    await widget.repo.actOnJob(id, action, body);
    if (!mounted) return;
    setState(() => _future = widget.repo.fetchMyJobs());
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snap.hasError) return Center(child: Text('${snap.error}'));
        final jobs = snap.data ?? [];
        if (jobs.isEmpty) return const Center(child: Text('No jobs assigned.'));
        return RefreshIndicator(
          onRefresh: () async => setState(() => _future = widget.repo.fetchMyJobs()),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('Assigned jobs', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 12),
              ...jobs.map((job) {
                final status = job['status'] as String? ?? '';
                final id = job['id'] as String;
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(job['title'] as String? ?? 'Job', style: const TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text(job['address'] as String? ?? ''),
                        Text(status.replaceAll('_', ' ')),
                        const SizedBox(height: 8),
                        Wrap(spacing: 8, children: [
                          if (status == 'assigned')
                            FilledButton(onPressed: () => _act(id, 'accept'), child: const Text('Accept')),
                          if (status == 'accepted')
                            FilledButton(onPressed: () => _act(id, 'start'), child: const Text('Start')),
                          if (status == 'in_progress')
                            FilledButton(onPressed: () => _act(id, 'complete'), child: const Text('Complete')),
                          if (status == 'assigned' || status == 'accepted' || status == 'in_progress')
                            OutlinedButton(onPressed: () => _act(id, 'escalate'), child: const Text('Escalate')),
                        ]),
                      ],
                    ),
                  ),
                );
              }),
            ],
          ),
        );
      },
    );
  }
}
