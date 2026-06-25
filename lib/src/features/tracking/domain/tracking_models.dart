import 'package:google_maps_flutter/google_maps_flutter.dart';

class LocationSample {
  const LocationSample({
    required this.latitude,
    required this.longitude,
    required this.accuracy,
    required this.recordedAt,
    this.speed,
    this.heading,
  });

  factory LocationSample.fromJson(Map<String, dynamic> json) {
    return LocationSample(
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      accuracy: (json['accuracy'] as num?)?.toDouble() ?? 0,
      speed: (json['speed'] as num?)?.toDouble(),
      heading: (json['heading'] as num?)?.toDouble(),
      recordedAt:
          DateTime.tryParse(json['recordedAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }

  final double latitude;
  final double longitude;
  final double accuracy;
  final double? speed;
  final double? heading;
  final DateTime recordedAt;

  LatLng get latLng => LatLng(latitude, longitude);

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
      'accuracy': accuracy,
      'speed': speed,
      'heading': heading,
      'recordedAt': recordedAt.toIso8601String(),
    };
  }
}

class GeofenceZone {
  const GeofenceZone({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    required this.radiusMeters,
  });

  factory GeofenceZone.fromJson(Map<String, dynamic> json) {
    return GeofenceZone(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Assigned zone',
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      radiusMeters: (json['radiusMeters'] as num).toDouble(),
    );
  }

  final String id;
  final String name;
  final double latitude;
  final double longitude;
  final double radiusMeters;

  LatLng get center => LatLng(latitude, longitude);

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'latitude': latitude,
      'longitude': longitude,
      'radiusMeters': radiusMeters,
    };
  }
}

enum ShiftStatus { notStarted, active, completed }

class WorkerShift {
  const WorkerShift({
    required this.id,
    required this.workerId,
    required this.status,
    this.startedAt,
    this.endedAt,
  });

  factory WorkerShift.fromJson(Map<String, dynamic> json) {
    return WorkerShift(
      id: json['id']?.toString() ?? '',
      workerId: json['workerId']?.toString() ?? '',
      status: ShiftStatus.values.firstWhere(
        (status) => status.name == json['status']?.toString(),
        orElse: () => ShiftStatus.notStarted,
      ),
      startedAt: DateTime.tryParse(json['startedAt']?.toString() ?? ''),
      endedAt: DateTime.tryParse(json['endedAt']?.toString() ?? ''),
    );
  }

  final String id;
  final String workerId;
  final ShiftStatus status;
  final DateTime? startedAt;
  final DateTime? endedAt;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'workerId': workerId,
      'status': status.name,
      'startedAt': startedAt?.toIso8601String(),
      'endedAt': endedAt?.toIso8601String(),
    };
  }
}
