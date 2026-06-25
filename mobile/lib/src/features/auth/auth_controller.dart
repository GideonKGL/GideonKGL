import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

final authControllerProvider = StateNotifierProvider<AuthController, AsyncValue<bool>>((ref) {
  return AuthController(ref.watch(apiClientProvider));
});

class AuthController extends StateNotifier<AsyncValue<bool>> {
  AuthController(this._api) : super(const AsyncData(false)) {
    _restore();
  }

  final ApiClient _api;

  Future<void> _restore() async {
    state = AsyncData(await sessionStore.accessToken() != null);
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final result = await _api.post('/auth/login', {'email': email, 'password': password});
      await sessionStore.saveSession(
        accessToken: result['accessToken'] as String,
        refreshToken: result['refreshToken'] as String,
        email: email,
      );
      return true;
    });
  }

  Future<void> pinLogin(String email, String pin) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final result = await _api.post('/auth/pin-login', {'email': email, 'pin': pin});
      await sessionStore.saveSession(
        accessToken: result['accessToken'] as String,
        refreshToken: result['refreshToken'] as String,
        email: email,
      );
      return true;
    });
  }

  Future<void> register(Map<String, dynamic> input) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final result = await _api.post('/auth/register', input);
      await sessionStore.saveSession(
        accessToken: result['accessToken'] as String,
        refreshToken: result['refreshToken'] as String,
        email: input['email'] as String,
      );
      return true;
    });
  }

  Future<void> setPin(String pin) async {
    await _api.post('/auth/pin', {'pin': pin});
  }

  Future<void> logout() async {
    await sessionStore.clear();
    state = const AsyncData(false);
  }
}
