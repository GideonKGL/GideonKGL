import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/providers.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/incidents/data/incident_repository_impl.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/incidents/domain/incident_models.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/incidents/domain/incident_repository.dart';

final incidentRepositoryProvider = Provider<IncidentRepository>((ref) {
  return IncidentRepositoryImpl(
    apiClient: ref.watch(apiClientProvider),
    socketService: ref.watch(socketServiceProvider),
  );
});

final incidentControllerProvider =
    AsyncNotifierProvider<IncidentController, IncidentReport?>(
  IncidentController.new,
);

class IncidentController extends AsyncNotifier<IncidentReport?> {
  IncidentRepository get _repository => ref.read(incidentRepositoryProvider);

  @override
  IncidentReport? build() => null;

  Future<void> submit(IncidentDraft draft) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _repository.submitReport(draft));
  }
}
