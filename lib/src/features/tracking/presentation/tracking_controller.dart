import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/core/providers.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/tracking/data/tracking_repository_impl.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/tracking/domain/tracking_models.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/tracking/domain/tracking_repository.dart';

final trackingRepositoryProvider = Provider<TrackingRepository>((ref) {
  return TrackingRepositoryImpl(
    apiClient: ref.watch(apiClientProvider),
    socketService: ref.watch(socketServiceProvider),
    locationService: ref.watch(locationServiceProvider),
    secureStorage: ref.watch(secureStorageProvider),
  );
});

final trackingControllerProvider =
    AsyncNotifierProvider<TrackingController, TrackingState>(
  TrackingController.new,
);

class TrackingState {
  const TrackingState({
    required this.isTracking,
    required this.isCheckedIn,
    required this.geofences,
    this.lastLocation,
    this.activeShift,
  });

  factory TrackingState.initial() {
    return const TrackingState(
      isTracking: false,
      isCheckedIn: false,
      geofences: [],
    );
  }

  final bool isTracking;
  final bool isCheckedIn;
  final List<GeofenceZone> geofences;
  final LocationSample? lastLocation;
  final WorkerShift? activeShift;

  TrackingState copyWith({
    bool? isTracking,
    bool? isCheckedIn,
    List<GeofenceZone>? geofences,
    LocationSample? lastLocation,
    WorkerShift? activeShift,
  }) {
    return TrackingState(
      isTracking: isTracking ?? this.isTracking,
      isCheckedIn: isCheckedIn ?? this.isCheckedIn,
      geofences: geofences ?? this.geofences,
      lastLocation: lastLocation ?? this.lastLocation,
      activeShift: activeShift ?? this.activeShift,
    );
  }
}

class TrackingController extends AsyncNotifier<TrackingState> {
  StreamSubscription<LocationSample>? _trackingSubscription;

  TrackingRepository get _repository => ref.read(trackingRepositoryProvider);

  @override
  Future<TrackingState> build() async {
    ref.onDispose(() => _trackingSubscription?.cancel());
    final geofences = await _repository.assignedGeofences();
    return TrackingState.initial().copyWith(geofences: geofences);
  }

  Future<void> startLiveTracking({required String workerId}) async {
    final current = state.valueOrNull ?? TrackingState.initial();
    await _trackingSubscription?.cancel();
    final stream = _repository.watchLiveLocation(
      workerId: workerId,
      geofences: current.geofences,
    );
    _trackingSubscription = stream.listen((sample) {
      final latest = state.valueOrNull ?? current;
      state = AsyncData(
        latest.copyWith(isTracking: true, lastLocation: sample),
      );
    }, onError: (Object error, StackTrace stackTrace) {
      state = AsyncError(error, stackTrace);
    });
    state = AsyncData(current.copyWith(isTracking: true));
  }

  Future<void> stopLiveTracking() async {
    await _trackingSubscription?.cancel();
    await _repository.stopLiveLocation();
    final current = state.valueOrNull ?? TrackingState.initial();
    state = AsyncData(current.copyWith(isTracking: false));
  }

  Future<void> sendSos({required String workerId}) async {
    final current = state.valueOrNull ?? TrackingState.initial();
    final location = current.lastLocation;
    if (location == null) {
      throw StateError('Location is not available yet.');
    }
    await _repository.sendSos(workerId: workerId, location: location);
  }

  Future<void> checkIn({required String workerId}) async {
    final current = state.valueOrNull ?? TrackingState.initial();
    final location = current.lastLocation;
    if (location == null) {
      throw StateError('Start tracking before check-in.');
    }
    await _repository.checkIn(workerId: workerId, location: location);
    state = AsyncData(current.copyWith(isCheckedIn: true));
  }

  Future<void> startShift({required String workerId}) async {
    final current = state.valueOrNull ?? TrackingState.initial();
    final location = current.lastLocation;
    if (location == null) {
      throw StateError('Start tracking before shift start.');
    }
    final shift = await _repository.startShift(
      workerId: workerId,
      location: location,
    );
    state = AsyncData(current.copyWith(activeShift: shift));
  }

  Future<void> endShift() async {
    final current = state.valueOrNull ?? TrackingState.initial();
    final shift = current.activeShift;
    final location = current.lastLocation;
    if (shift == null || location == null) {
      throw StateError('There is no active shift to end.');
    }
    final endedShift = await _repository.endShift(
      shiftId: shift.id,
      location: location,
    );
    state = AsyncData(current.copyWith(activeShift: endedShift));
  }
}
