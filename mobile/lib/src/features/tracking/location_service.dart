import 'package:geolocator/geolocator.dart';
import '../../core/api_client.dart';

class LocationService {
  LocationService(this._api);

  final ApiClient _api;

  Future<Position> currentPosition() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) {
      throw StateError('Location services are disabled');
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
      throw StateError('Location permission denied');
    }

    return Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
  }

  Future<void> sendLocation(String deviceId) async {
    final position = await currentPosition();
    await _api.post('/locations', {
      'deviceId': deviceId,
      'latitude': position.latitude,
      'longitude': position.longitude,
      'accuracy': position.accuracy,
      'speed': position.speed,
      'heading': position.heading,
      'altitude': position.altitude,
      'recordedAt': DateTime.now().toUtc().toIso8601String(),
    });
  }
}
