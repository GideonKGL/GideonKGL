import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/auth/presentation/auth_controller.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/auth/presentation/login_screen.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/auth/presentation/pin_login_screen.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/dashboard/presentation/dashboard_screen.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/incidents/presentation/incident_report_screen.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/profile/presentation/profile_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/dashboard',
    redirect: (context, state) {
      if (authState.isLoading) {
        return null;
      }

      final isSignedIn = authState.valueOrNull != null;
      final isAuthRoute =
          state.uri.path == '/login' || state.uri.path == '/pin';

      if (!isSignedIn && !isAuthRoute) {
        return '/login';
      }
      if (isSignedIn && isAuthRoute) {
        return '/dashboard';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/pin',
        builder: (context, state) => const PinLoginScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/incident',
        builder: (context, state) => const IncidentReportScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
  );
});
