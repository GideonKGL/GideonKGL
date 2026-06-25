import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SessionStore {
  SessionStore(this._storage);

  final FlutterSecureStorage _storage;

  static const _accessTokenKey = 'guardian_access_token';
  static const _refreshTokenKey = 'guardian_refresh_token';
  static const _deviceIdKey = 'guardian_device_id';
  static const _emailKey = 'guardian_email';

  Future<void> saveSession({
    required String accessToken,
    required String refreshToken,
    required String email,
  }) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
    await _storage.write(key: _emailKey, value: email);
  }

  Future<String?> accessToken() => _storage.read(key: _accessTokenKey);
  Future<String?> refreshToken() => _storage.read(key: _refreshTokenKey);
  Future<String?> email() => _storage.read(key: _emailKey);

  Future<void> saveDeviceId(String id) => _storage.write(key: _deviceIdKey, value: id);
  Future<String?> deviceId() => _storage.read(key: _deviceIdKey);

  Future<void> clear() => _storage.deleteAll();
}
