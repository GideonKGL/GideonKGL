import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/config/app_config.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/location/location_service.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/network/api_client.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/network/socket_service.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/security/secure_storage_service.dart';

final appConfigProvider = Provider<AppConfig>((ref) {
  return AppConfig.fromEnvironment();
});

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    config: ref.watch(appConfigProvider),
    secureStorage: ref.watch(secureStorageProvider),
  );
});

final socketServiceProvider = Provider<SocketService>((ref) {
  final service = SocketService(config: ref.watch(appConfigProvider));
  ref.onDispose(service.disconnect);
  return service;
});

final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
});

final localAuthenticationProvider = Provider<LocalAuthentication>((ref) {
  return LocalAuthentication();
});
