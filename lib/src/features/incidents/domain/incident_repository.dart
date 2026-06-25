import 'package:securitatem_defensionis_guardian_tracker/src/features/incidents/domain/incident_models.dart';

abstract interface class IncidentRepository {
  Future<IncidentReport> submitReport(IncidentDraft draft);
}

class IncidentDraft {
  const IncidentDraft({
    required this.workerId,
    required this.title,
    required this.description,
    required this.severity,
    this.latitude,
    this.longitude,
    this.photoPath,
  });

  final String workerId;
  final String title;
  final String description;
  final IncidentSeverity severity;
  final double? latitude;
  final double? longitude;
  final String? photoPath;

  Map<String, dynamic> toJson() {
    return {
      'workerId': workerId,
      'title': title,
      'description': description,
      'severity': severity.name,
      'latitude': latitude,
      'longitude': longitude,
      'photoPath': photoPath,
    };
  }
}
