import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/auth/presentation/auth_controller.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/tracking/domain/tracking_models.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/tracking/presentation/tracking_controller.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  static const _fallbackCamera = CameraPosition(
    target: LatLng(38.9072, -77.0369),
    zoom: 14,
  );

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authControllerProvider).valueOrNull;
    final trackingState = ref.watch(trackingControllerProvider);

    if (session == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Guardian Dashboard'),
        actions: [
          IconButton(
            tooltip: 'Profile',
            onPressed: () => context.go('/profile'),
            icon: const Icon(Icons.account_circle_outlined),
          ),
        ],
      ),
      body: trackingState.when(
        data: (state) => _DashboardBody(
          state: state,
          workerId: session.user.id,
          workerName: session.user.name,
        ),
        error: (error, _) => Center(child: Text(error.toString())),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'incident',
        onPressed: () => context.go('/incident'),
        icon: const Icon(Icons.add_alert_outlined),
        label: const Text('Report Incident'),
      ),
    );
  }
}

class _DashboardBody extends ConsumerWidget {
  const _DashboardBody({
    required this.state,
    required this.workerId,
    required this.workerName,
  });

  final TrackingState state;
  final String workerId;
  final String workerName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _StatusCard(
          workerName: workerName,
          state: state,
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 320,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: GoogleMap(
              myLocationButtonEnabled: true,
              myLocationEnabled: true,
              initialCameraPosition: state.lastLocation == null
                  ? DashboardScreen._fallbackCamera
                  : CameraPosition(
                      target: state.lastLocation!.latLng,
                      zoom: 16,
                    ),
              markers: {
                if (state.lastLocation != null)
                  Marker(
                    markerId: const MarkerId('worker'),
                    position: state.lastLocation!.latLng,
                    infoWindow: InfoWindow(title: workerName),
                  ),
              },
              circles: state.geofences
                  .map(
                    (zone) => Circle(
                      circleId: CircleId(zone.id),
                      center: zone.center,
                      radius: zone.radiusMeters,
                      strokeColor: Theme.of(context).colorScheme.primary,
                      fillColor: Theme.of(context)
                          .colorScheme
                          .primary
                          .withValues(alpha: 0.12),
                      strokeWidth: 2,
                    ),
                  )
                  .toSet(),
            ),
          ),
        ),
        const SizedBox(height: 16),
        _ActionGrid(state: state, workerId: workerId),
      ],
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({
    required this.workerName,
    required this.state,
  });

  final String workerName;
  final TrackingState state;

  @override
  Widget build(BuildContext context) {
    final timestamp = state.lastLocation?.recordedAt;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome, $workerName',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _StatusChip(
                  icon: Icons.satellite_alt_outlined,
                  label: state.isTracking ? 'Live GPS active' : 'GPS idle',
                ),
                _StatusChip(
                  icon: Icons.how_to_reg_outlined,
                  label: state.isCheckedIn ? 'Checked in' : 'Not checked in',
                ),
                _StatusChip(
                  icon: Icons.work_history_outlined,
                  label: state.activeShift?.status == ShiftStatus.active
                      ? 'Shift active'
                      : 'Shift inactive',
                ),
              ],
            ),
            if (timestamp != null) ...[
              const SizedBox(height: 12),
              Text(
                'Last location: ${DateFormat.yMMMd().add_jm().format(timestamp)}',
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: Icon(icon, size: 18),
      label: Text(label),
    );
  }
}

class _ActionGrid extends ConsumerWidget {
  const _ActionGrid({
    required this.state,
    required this.workerId,
  });

  final TrackingState state;
  final String workerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(trackingControllerProvider.notifier);
    return GridView.count(
      crossAxisCount: MediaQuery.sizeOf(context).width > 700 ? 4 : 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.2,
      children: [
        _DashboardAction(
          color: Colors.blue,
          icon: state.isTracking ? Icons.stop_circle_outlined : Icons.gps_fixed,
          label: state.isTracking ? 'Stop Tracking' : 'Start Tracking',
          onPressed: () => _run(
            context,
            state.isTracking
                ? controller.stopLiveTracking()
                : controller.startLiveTracking(workerId: workerId),
          ),
        ),
        _DashboardAction(
          color: Colors.red,
          icon: Icons.sos,
          label: 'SOS Emergency',
          onPressed: () => _run(
            context,
            controller.sendSos(workerId: workerId),
            success: 'SOS alert sent.',
          ),
        ),
        _DashboardAction(
          color: Colors.green,
          icon: Icons.how_to_reg_outlined,
          label: 'Worker Check-In',
          onPressed: () => _run(
            context,
            controller.checkIn(workerId: workerId),
            success: 'Check-in recorded.',
          ),
        ),
        _DashboardAction(
          color: Colors.deepPurple,
          icon: state.activeShift?.status == ShiftStatus.active
              ? Icons.event_busy_outlined
              : Icons.event_available_outlined,
          label: state.activeShift?.status == ShiftStatus.active
              ? 'End Shift'
              : 'Start Shift',
          onPressed: () => _run(
            context,
            state.activeShift?.status == ShiftStatus.active
                ? controller.endShift()
                : controller.startShift(workerId: workerId),
            success: 'Shift updated.',
          ),
        ),
      ],
    );
  }

  Future<void> _run(
    BuildContext context,
    Future<void> action, {
    String? success,
  }) async {
    try {
      await action;
      if (success != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(success)),
        );
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    }
  }
}

class _DashboardAction extends StatelessWidget {
  const _DashboardAction({
    required this.color,
    required this.icon,
    required this.label,
    required this.onPressed,
  });

  final Color color;
  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      style: FilledButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
      onPressed: onPressed,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 32),
          const SizedBox(height: 8),
          Text(label, textAlign: TextAlign.center),
        ],
      ),
    );
  }
}
