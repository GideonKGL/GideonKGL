import 'package:dio/dio.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/config/app_config.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/errors/app_exception.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/security/secure_storage_service.dart';

class ApiClient {
  ApiClient({
    required AppConfig config,
    required SecureStorageService secureStorage,
    Dio? dio,
  }) : _secureStorage = secureStorage,
       _dio = dio ?? Dio(
         BaseOptions(
           baseUrl: config.apiBaseUrl,
           connectTimeout: const Duration(seconds: 20),
           receiveTimeout: const Duration(seconds: 20),
           sendTimeout: const Duration(seconds: 20),
           headers: const {'Accept': 'application/json'},
         ),
       ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _secureStorage.readAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  final Dio _dio;
  final SecureStorageService _secureStorage;

  Future<Map<String, dynamic>> getJson(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    final response = await _guard(
      () => _dio.get<Object?>(
        path,
        queryParameters: queryParameters,
      ),
    );
    return _asMap(response.data);
  }

  Future<Map<String, dynamic>> postJson(
    String path, {
    Object? data,
  }) async {
    final response = await _guard(() => _dio.post<Object?>(path, data: data));
    return _asMap(response.data);
  }

  Future<Map<String, dynamic>> putJson(
    String path, {
    Object? data,
  }) async {
    final response = await _guard(() => _dio.put<Object?>(path, data: data));
    return _asMap(response.data);
  }

  Future<Response<Object?>> _guard(
    Future<Response<Object?>> Function() request,
  ) async {
    try {
      return await request();
    } on DioException catch (error) {
      throw _normalizeError(error);
    }
  }

  AppException _normalizeError(DioException error) {
    final statusCode = error.response?.statusCode;
    final data = error.response?.data;
    final message = switch (data) {
      {'message': final String message} => message,
      {'error': final String message} => message,
      _ => error.message ?? 'Network request failed',
    };

    if (statusCode == 401 || statusCode == 403) {
      return AuthenticationException(message, cause: error);
    }

    return NetworkException(message, cause: error);
  }

  Map<String, dynamic> _asMap(Object? value) {
    if (value is Map<String, dynamic>) {
      return value;
    }
    if (value is Map) {
      return value.map((key, value) => MapEntry(key.toString(), value));
    }
    return <String, dynamic>{'data': value};
  }
}
