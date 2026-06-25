import 'package:securitatem_defensionis_guardian_tracker/src/features/auth/domain/auth_models.dart';

abstract interface class AuthRepository {
  Future<AuthSession?> restoreSession();

  Future<AuthSession> login({
    required String email,
    required String password,
  });

  Future<AuthSession> loginWithPin(String pin);

  Future<AuthSession> loginWithBiometrics();

  Future<void> enablePin(String pin);

  Future<void> logout();
}
