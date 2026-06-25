import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/auth_controller.dart';
import '../features/auth/auth_screens.dart';
import '../features/profile/profile_screen.dart';
import '../features/settings/settings_screen.dart';
import '../features/sos/sos_screen.dart';
import '../features/tracking/home_screen.dart';
import '../features/tracking/tracking_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authControllerProvider);
  final loggedIn = auth.valueOrNull == true;

  return GoRouter(
    initialLocation: loggedIn ? '/home' : '/login',
    redirect: (context, state) {
      final onAuthRoute = ['/login', '/pin-login', '/register', '/password-reset'].contains(state.matchedLocation);
      if (!loggedIn && !onAuthRoute) return '/login';
      if (loggedIn && onAuthRoute) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/pin-login', builder: (context, state) => const PinLoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
      GoRoute(path: '/password-reset', builder: (context, state) => const PasswordResetScreen()),
      GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
      GoRoute(path: '/tracking', builder: (context, state) => const TrackingScreen()),
      GoRoute(path: '/sos', builder: (context, state) => const SosScreen()),
      GoRoute(path: '/profile', builder: (context, state) => const ProfileScreen()),
      GoRoute(path: '/settings', builder: (context, state) => const SettingsScreen()),
    ],
  );
});
