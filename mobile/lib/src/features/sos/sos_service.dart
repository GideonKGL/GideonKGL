import '../tracking/location_service.dart';
import '../../core/api_client.dart';

class SosService {
  SosService(this._api, this._locationService);

  final ApiClient _api;
  final LocationService _locationService;

  Future<void> trigger(String deviceId, {String? message}) async {
    final position = await _locationService.currentPosition();
    await _api.post('/alerts/sos', {
      'deviceId': deviceId,
      'latitude': position.latitude,
      'longitude': position.longitude,
      if (message != null && message.isNotEmpty) 'message': message,
    });
  }
}
