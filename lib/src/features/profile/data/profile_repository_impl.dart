import 'package:securitatem_defensionis_guardian_tracker/src/core/network/api_client.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/auth/domain/auth_models.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/profile/domain/profile_repository.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  const ProfileRepositoryImpl({required ApiClient apiClient})
    : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<GuardianUser> updateProfile({
    required String name,
    required String phoneNumber,
  }) async {
    final response = await _apiClient.putJson('/users/me', data: {
      'name': name.trim(),
      'phoneNumber': phoneNumber.trim(),
    });
    final data = response['data'];
    return GuardianUser.fromJson(
      data is Map<String, dynamic> ? data : response,
    );
  }
}
