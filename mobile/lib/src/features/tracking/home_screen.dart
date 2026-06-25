import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../shared/app_scaffold.dart';
import '../devices/device_service.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _registerDevice(WidgetRef ref, BuildContext context) async {
    final id = await DeviceService(ref.read(apiClientProvider)).registerDevice();
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Device registered: $id')));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AppScaffold(
      title: 'Guardian Tracker',
      child: GridView.count(
        padding: const EdgeInsets.all(16),
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        children: [
          _Tile(icon: Icons.app_registration, title: 'Register Device', onTap: () => _registerDevice(ref, context)),
          _Tile(icon: Icons.map, title: 'Live Tracking', onTap: () => context.go('/tracking')),
          _Tile(icon: Icons.sos, title: 'SOS Emergency', color: Colors.red, onTap: () => context.go('/sos')),
          _Tile(icon: Icons.person, title: 'Profile', onTap: () => context.go('/profile')),
          _Tile(icon: Icons.settings, title: 'Settings', onTap: () => context.go('/settings')),
        ],
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.icon, required this.title, required this.onTap, this.color});

  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 44, color: color),
            const SizedBox(height: 12),
            Text(title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
          ],
        ),
      ),
    );
  }
}
