import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/app/guardian_tracker_app.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/notifications/push_notification_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  final pushNotifications = PushNotificationService();
  await pushNotifications.initialize();

  runApp(
    ProviderScope(
      overrides: [
        pushNotificationServiceProvider.overrideWithValue(pushNotifications),
      ],
      child: const GuardianTrackerApp(),
    ),
  );
}
