import 'dart:async';

import 'package:geolocator/geolocator.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/location/location_service.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/network/api_client.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/network/socket_service.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/security/secure_storage_service.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/tracking/domain/tracking_models.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/tracking/domain/tracking_repository.dart';

class TrackingRepositoryImpl implements TrackingRepository {
  TrackingRepositoryImpl({
    required ApiClient apiClient,
    required SocketService socketService,
    required LocationService locationService,
    required SecureStorageService secureStorage,
  }) : _apiClient = apiClient,
       _socketService = socketService,
       _locationService = locationService,
       _secureStorage = secureStorage;

  final ApiClient _apiClient;
  final SocketService _socketService;
  final LocationService _locationService;
  final SecureStorageService _secureStorage;
  StreamSubscription<Position>? _positionSubscription;

  @override
  Future<List<GeofenceZone>> assignedGeofences() async {
    final response = await _apiClient.getJson('/geofences/assigned');
    final data = response['data'];
    if (data is! List) {
      return const [];
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(GeofenceZone.fromJson)
        .toList(growable: false);
  }

  @override
  Stream<LocationSample> watchLiveLocation({
    required String workerId,
    required List<GeofenceZone> geofences,
  }) {
    final controller = StreamController<LocationSample>.broadcast();
    unawaited(_startLocationStream(workerId, geofences, controller));
    controller.onCancel = stopLiveLocation;
    return controller.stream;
  }

  @override
  Future<void> sendSos({
    required String workerId,
    required LocationSample location,
  }) async {
    final payload = {
      'workerId': workerId,
      'triggeredAt': DateTime.now().toIso8601String(),
      'location': location.toJson(),
    };
    await _apiClient.postJson('/emergency/sos', data: payload);
    _socketService.emit('emergency.sos', payload);
  }

  @override
  Future<void> checkIn({
    required String workerId,
    required LocationSample location,
  }) async {
    final payload = {
      'workerId': workerId,
      'checkedInAt': DateTime.now().toIso8601String(),
      'location': location.toJson(),
    };
    await _apiClient.postJson('/workers/check-ins', data: payload);
    _socketService.emit('worker.check_in', payload);
  }

  @override
  Future<WorkerShift> startShift({
    required String workerId,
    required LocationSample location,
  }) async {
    final response = await _apiClient.postJson('/shifts/start', data: {
      'workerId': workerId,
      'location': location.toJson(),
    });
    final shift = WorkerShift.fromJson(_extractData(response));
    _socketService.emit('shift.started', shift.toJson());
    return shift;
  }

  @override
  Future<WorkerShift> endShift({
    required String shiftId,
    required LocationSample location,
  }) async {
    final response = await _apiClient.postJson('/shifts/$shiftId/end', data: {
      'location': location.toJson(),
    });
    final shift = WorkerShift.fromJson(_extractData(response));
    _socketService.emit('shift.ended', shift.toJson());
    return shift;
  }

  @override
  Future<void> stopLiveLocation() async {
    await _positionSubscription?.cancel();
    _positionSubscription = null;
  }

  Future<void> _startLocationStream(
    String workerId,
    List<GeofenceZone> geofences,
    StreamController<LocationSample> controller,
  ) async {
    try {
      final accessToken = await _secureStorage.readAccessToken();
      if (accessToken != null &&
          accessToken.isNotEmpty &&
          !_socketService.isConnected) {
        await _socketService.connect(accessToken: accessToken);
      }
      _positionSubscription = _locationService.positionStream().listen(
        (position) async {
          final sample = _fromPosition(position);
          controller.add(sample);
          await _apiClient.postJson(
            '/tracking/live',
            data: {'workerId': workerId, ...sample.toJson()},
          );
          _socketService.emit('tracking.location', {
            'workerId': workerId,
            ...sample.toJson(),
          });
          _emitGeofenceEvents(
            workerId: workerId,
            sample: sample,
            zones: geofences,
          );
        },
        onError: controller.addError,
      );
    } catch (error, stackTrace) {
      controller.addError(error, stackTrace);
    }
  }

  void _emitGeofenceEvents({
    required String workerId,
    required LocationSample sample,
    required List<GeofenceZone> zones,
  }) {
    for (final zone in zones) {
      final distance = _locationService.distanceInMeters(
        startLatitude: sample.latitude,
        startLongitude: sample.longitude,
        endLatitude: zone.latitude,
        endLongitude: zone.longitude,
      );
      if (distance > zone.radiusMeters) {
        final payload = {
          'workerId': workerId,
          'zoneId': zone.id,
          'distanceMeters': distance,
          'location': sample.toJson(),
          'recordedAt': DateTime.now().toIso8601String(),
        };
        _socketService.emit('geofence.exit', payload);
        unawaited(_apiClient.postJson('/geofences/events', data: payload));
      }
    }
  }

  LocationSample _fromPosition(Position position) {
    return LocationSample(
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      speed: position.speed,
      heading: position.heading,
      recordedAt: position.timestamp,
    );
  }

  Map<String, dynamic> _extractData(Map<String, dynamic> response) {
    final data = response['data'];
    return data is Map<String, dynamic> ? data : response;
  }
}
