import 'package:securitatem_defensionis_guardian_tracker/src/features/auth/domain/auth_models.dart';

abstract interface class ProfileRepository {
  Future<GuardianUser> updateProfile({
    required String name,
    required String phoneNumber,
  });
}
