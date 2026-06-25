import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/providers.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/auth/data/auth_repository_impl.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/auth/domain/auth_models.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/auth/domain/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    apiClient: ref.watch(apiClientProvider),
    secureStorage: ref.watch(secureStorageProvider),
    localAuthentication: ref.watch(localAuthenticationProvider),
  );
});

final authControllerProvider =
    AsyncNotifierProvider<AuthController, AuthSession?>(AuthController.new);

class AuthController extends AsyncNotifier<AuthSession?> {
  AuthRepository get _repository => ref.read(authRepositoryProvider);

  @override
  Future<AuthSession?> build() {
    return _repository.restoreSession();
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => _repository.login(email: email, password: password),
    );
  }

  Future<void> loginWithPin(String pin) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _repository.loginWithPin(pin));
  }

  Future<void> loginWithBiometrics() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_repository.loginWithBiometrics);
  }

  Future<void> enablePin(String pin) async {
    await _repository.enablePin(pin);
    final session = state.valueOrNull;
    if (session != null) {
      state = AsyncData(session.copyWith(pinEnabled: true));
    }
  }

  void updateCurrentUser(GuardianUser user) {
    final session = state.valueOrNull;
    if (session != null) {
      state = AsyncData(session.copyWith(user: user));
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    state = const AsyncData(null);
  }
}
