enum IncidentSeverity { low, medium, high, critical }

class IncidentReport {
  const IncidentReport({
    required this.id,
    required this.workerId,
    required this.title,
    required this.description,
    required this.severity,
    required this.reportedAt,
    this.latitude,
    this.longitude,
    this.photoPath,
  });

  factory IncidentReport.fromJson(Map<String, dynamic> json) {
    return IncidentReport(
      id: json['id']?.toString() ?? '',
      workerId: json['workerId']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      severity: IncidentSeverity.values.firstWhere(
        (severity) => severity.name == json['severity']?.toString(),
        orElse: () => IncidentSeverity.medium,
      ),
      reportedAt:
          DateTime.tryParse(json['reportedAt']?.toString() ?? '') ??
          DateTime.now(),
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      photoPath: json['photoPath']?.toString(),
    );
  }

  final String id;
  final String workerId;
  final String title;
  final String description;
  final IncidentSeverity severity;
  final DateTime reportedAt;
  final double? latitude;
  final double? longitude;
  final String? photoPath;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'workerId': workerId,
      'title': title,
      'description': description,
      'severity': severity.name,
      'reportedAt': reportedAt.toIso8601String(),
      'latitude': latitude,
      'longitude': longitude,
      'photoPath': photoPath,
    };
  }
}
