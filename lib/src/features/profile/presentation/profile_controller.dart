import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/providers.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/auth/domain/auth_models.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/profile/data/profile_repository_impl.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/profile/domain/profile_repository.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepositoryImpl(apiClient: ref.watch(apiClientProvider));
});

final profileControllerProvider =
    AsyncNotifierProvider<ProfileController, GuardianUser?>(
  ProfileController.new,
);

class ProfileController extends AsyncNotifier<GuardianUser?> {
  ProfileRepository get _repository => ref.read(profileRepositoryProvider);

  @override
  GuardianUser? build() => null;

  Future<void> updateProfile({
    required String name,
    required String phoneNumber,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => _repository.updateProfile(name: name, phoneNumber: phoneNumber),
    );
  }
}
