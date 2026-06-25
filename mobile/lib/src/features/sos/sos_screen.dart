import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../../shared/app_scaffold.dart';
import '../tracking/location_service.dart';
import 'sos_service.dart';

class SosScreen extends ConsumerStatefulWidget {
  const SosScreen({super.key});

  @override
  ConsumerState<SosScreen> createState() => _SosScreenState();
}

class _SosScreenState extends ConsumerState<SosScreen> {
  final _message = TextEditingController();
  bool _sending = false;

  Future<void> _trigger() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Trigger SOS?'),
        content: const Text('Emergency responders and monitoring consoles will be notified immediately.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Send SOS')),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _sending = true);
    final api = ref.read(apiClientProvider);
    final deviceId = await sessionStore.deviceId();
    if (deviceId == null) {
      throw StateError('Device is not registered');
    }
    await SosService(api, LocationService(api)).trigger(deviceId, message: _message.text);
    setState(() => _sending = false);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('SOS alert sent')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'SOS Emergency',
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Icon(Icons.sos, size: 96, color: Colors.red),
          const SizedBox(height: 24),
          TextField(controller: _message, decoration: const InputDecoration(labelText: 'Optional message'), maxLines: 3),
          const SizedBox(height: 24),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: _sending ? null : _trigger,
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Text(_sending ? 'Sending SOS...' : 'PRESS TO SEND SOS'),
            ),
          ),
        ],
      ),
    );
  }
}
