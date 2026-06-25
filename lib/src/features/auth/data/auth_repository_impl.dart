import 'package:local_auth/local_auth.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/errors/app_exception.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/network/api_client.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/security/secure_storage_service.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/auth/domain/auth_models.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/auth/domain/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl({
    required ApiClient apiClient,
    required SecureStorageService secureStorage,
    required LocalAuthentication localAuthentication,
  }) : _apiClient = apiClient,
       _secureStorage = secureStorage,
       _localAuthentication = localAuthentication;

  final ApiClient _apiClient;
  final SecureStorageService _secureStorage;
  final LocalAuthentication _localAuthentication;

  @override
  Future<AuthSession?> restoreSession() async {
    final token = await _secureStorage.readAccessToken();
    if (token == null || token.isEmpty) {
      return null;
    }

    final response = await _apiClient.getJson('/users/me');
    return AuthSession(
      user: GuardianUser.fromJson(_extractUser(response)),
      accessToken: token,
      refreshToken: await _secureStorage.readRefreshToken(),
      pinEnabled: await _secureStorage.isPinEnabled(),
    );
  }

  @override
  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.postJson(
      '/auth/login',
      data: <String, String>{'email': email.trim(), 'password': password},
    );
    return _persistSession(AuthSession.fromJson(response));
  }

  @override
  Future<AuthSession> loginWithPin(String pin) async {
    _validatePin(pin);
    final response = await _apiClient.postJson(
      '/auth/pin',
      data: <String, String>{'pin': pin},
    );
    return _persistSession(AuthSession.fromJson(response).copyWith(
      pinEnabled: true,
    ));
  }

  @override
  Future<AuthSession> loginWithBiometrics() async {
    final canAuthenticate =
        await _localAuthentication.canCheckBiometrics ||
        await _localAuthentication.isDeviceSupported();
    if (!canAuthenticate) {
      throw const AuthenticationException(
        'Biometric authentication is not available on this device.',
      );
    }

    final didAuthenticate = await _localAuthentication.authenticate(
      localizedReason: 'Authenticate to access Guardian Tracker.',
      options: const AuthenticationOptions(
        biometricOnly: true,
        stickyAuth: true,
      ),
    );
    if (!didAuthenticate) {
      throw const AuthenticationException('Biometric authentication failed.');
    }

    final refreshToken = await _secureStorage.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      throw const AuthenticationException(
        'Please sign in before using biometric login.',
      );
    }

    final response = await _apiClient.postJson(
      '/auth/biometric',
      data: <String, String>{'refreshToken': refreshToken},
    );
    return _persistSession(AuthSession.fromJson(response));
  }

  @override
  Future<void> enablePin(String pin) async {
    _validatePin(pin);
    await _apiClient.postJson('/auth/pin/setup', data: <String, String>{
      'pin': pin,
    });
    await _secureStorage.setPinEnabled(true);
  }

  @override
  Future<void> logout() async {
    await _apiClient.postJson('/auth/logout');
    await _secureStorage.clearSession();
  }

  Future<AuthSession> _persistSession(AuthSession session) async {
    await _secureStorage.saveTokens(
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    );
    await _secureStorage.setPinEnabled(session.pinEnabled);
    return session;
  }

  Map<String, dynamic> _extractUser(Map<String, dynamic> response) {
    final data = response['data'];
    if (data is Map<String, dynamic>) {
      return data;
    }
    final user = response['user'];
    if (user is Map<String, dynamic>) {
      return user;
    }
    return response;
  }

  void _validatePin(String pin) {
    if (!RegExp(r'^\d{6}$').hasMatch(pin)) {
      throw const ValidationException('PIN must be exactly 6 digits.');
    }
  }
}
