import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../core/api_client.dart';
import '../../shared/app_scaffold.dart';
import 'location_service.dart';

class TrackingScreen extends ConsumerStatefulWidget {
  const TrackingScreen({super.key});

  @override
  ConsumerState<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends ConsumerState<TrackingScreen> {
  LatLng? _position;
  bool _sending = false;

  Future<void> _sendLocation() async {
    setState(() => _sending = true);
    final api = ref.read(apiClientProvider);
    final service = LocationService(api);
    final deviceId = await sessionStore.deviceId();
    final position = await service.currentPosition();
    if (deviceId != null) {
      await service.sendLocation(deviceId);
    }
    setState(() {
      _position = LatLng(position.latitude, position.longitude);
      _sending = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final marker = _position == null
        ? <Marker>{}
        : {Marker(markerId: const MarkerId('current'), position: _position!, infoWindow: const InfoWindow(title: 'Current position'))};

    return AppScaffold(
      title: 'Live Tracking',
      child: Column(
        children: [
          Expanded(
            child: GoogleMap(
              initialCameraPosition: CameraPosition(target: _position ?? const LatLng(-26.2041, 28.0473), zoom: 14),
              markers: marker,
              myLocationEnabled: true,
              myLocationButtonEnabled: true,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: FilledButton.icon(
              onPressed: _sending ? null : _sendLocation,
              icon: const Icon(Icons.gps_fixed),
              label: Text(_sending ? 'Sending...' : 'Send location update'),
            ),
          ),
        ],
      ),
    );
  }
}
