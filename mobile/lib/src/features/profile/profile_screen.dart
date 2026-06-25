import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../../shared/app_scaffold.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.watch(apiClientProvider);
    return FutureBuilder(
      future: api.get('/users/me'),
      builder: (context, snapshot) {
        return AppScaffold(
          title: 'Profile',
          child: snapshot.hasData
              ? ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    Text('${snapshot.data!['firstName']} ${snapshot.data!['lastName']}', style: Theme.of(context).textTheme.headlineSmall),
                    Text(snapshot.data!['email'] as String),
                    const SizedBox(height: 24),
                    Text('Phone: ${snapshot.data!['phone'] ?? 'Not provided'}'),
                  ],
                )
              : const Center(child: CircularProgressIndicator()),
        );
      },
    );
  }
}
