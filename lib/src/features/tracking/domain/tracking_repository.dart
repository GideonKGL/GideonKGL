import 'package:securitatem_defensionis_guardian_tracker/src/features/tracking/domain/tracking_models.dart';

abstract interface class TrackingRepository {
  Future<List<GeofenceZone>> assignedGeofences();

  Stream<LocationSample> watchLiveLocation({
    required String workerId,
    required List<GeofenceZone> geofences,
  });

  Future<void> sendSos({
    required String workerId,
    required LocationSample location,
  });

  Future<void> checkIn({
    required String workerId,
    required LocationSample location,
  });

  Future<WorkerShift> startShift({
    required String workerId,
    required LocationSample location,
  });

  Future<WorkerShift> endShift({
    required String shiftId,
    required LocationSample location,
  });

  Future<void> stopLiveLocation();
}
