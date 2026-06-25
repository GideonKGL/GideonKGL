import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/app/app_router.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/app/app_theme.dart';

class GuardianTrackerApp extends ConsumerWidget {
  const GuardianTrackerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'Guardian Tracker',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      routerConfig: router,
    );
  }
}
