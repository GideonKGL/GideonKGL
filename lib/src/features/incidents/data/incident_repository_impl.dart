import 'package:securitatem_defensionis_guardian_tracker/src/core/network/api_client.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/network/socket_service.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/incidents/domain/incident_models.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/incidents/domain/incident_repository.dart';

class IncidentRepositoryImpl implements IncidentRepository {
  const IncidentRepositoryImpl({
    required ApiClient apiClient,
    required SocketService socketService,
  }) : _apiClient = apiClient,
       _socketService = socketService;

  final ApiClient _apiClient;
  final SocketService _socketService;

  @override
  Future<IncidentReport> submitReport(IncidentDraft draft) async {
    final response = await _apiClient.postJson(
      '/incidents',
      data: draft.toJson(),
    );
    final data = response['data'];
    final report = IncidentReport.fromJson(
      data is Map<String, dynamic> ? data : response,
    );
    _socketService.emit('incident.reported', report.toJson());
    return report;
  }
}
