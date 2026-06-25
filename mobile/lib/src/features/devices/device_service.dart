import 'package:device_info_plus/device_info_plus.dart';
import '../../core/api_client.dart';

class DeviceService {
  DeviceService(this._api);

  final ApiClient _api;

  Future<String> registerDevice() async {
    final androidInfo = await DeviceInfoPlugin().androidInfo;
    final result = await _api.post('/devices', {
      'name': '${androidInfo.manufacturer} ${androidInfo.model}',
      'platform': 'ANDROID',
      'deviceUid': androidInfo.id,
    });
    final id = result['id'] as String;
    await sessionStore.saveDeviceId(id);
    return id;
  }
}
