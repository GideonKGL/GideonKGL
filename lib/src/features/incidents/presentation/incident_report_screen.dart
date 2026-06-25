import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/auth/presentation/auth_controller.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/incidents/domain/incident_models.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/incidents/domain/incident_repository.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/incidents/presentation/incident_controller.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/tracking/presentation/tracking_controller.dart';

class IncidentReportScreen extends ConsumerStatefulWidget {
  const IncidentReportScreen({super.key});

  @override
  ConsumerState<IncidentReportScreen> createState() =>
      _IncidentReportScreenState();
}

class _IncidentReportScreenState extends ConsumerState<IncidentReportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  IncidentSeverity _severity = IncidentSeverity.medium;
  String? _photoPath;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(incidentControllerProvider, (previous, next) {
      next.whenOrNull(
        data: (report) {
          if (report != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Incident report submitted.')),
            );
            context.go('/dashboard');
          }
        },
        error: (error, _) => ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        ),
      );
    });

    final incidentState = ref.watch(incidentControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Incident Reporting')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  controller: _titleController,
                  decoration: const InputDecoration(
                    labelText: 'Incident title',
                    prefixIcon: Icon(Icons.report_problem_outlined),
                  ),
                  validator: (value) =>
                      (value ?? '').trim().isEmpty ? 'Title is required.' : null,
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<IncidentSeverity>(
                  value: _severity,
                  decoration: const InputDecoration(
                    labelText: 'Severity',
                    prefixIcon: Icon(Icons.priority_high),
                  ),
                  items: IncidentSeverity.values
                      .map(
                        (severity) => DropdownMenuItem(
                          value: severity,
                          child: Text(severity.name.toUpperCase()),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _severity = value);
                    }
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _descriptionController,
                  minLines: 5,
                  maxLines: 8,
                  decoration: const InputDecoration(
                    alignLabelWithHint: true,
                    labelText: 'Description',
                    prefixIcon: Icon(Icons.notes_outlined),
                  ),
                  validator: (value) => (value ?? '').trim().length < 12
                      ? 'Please add a meaningful description.'
                      : null,
                ),
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  onPressed: _pickPhoto,
                  icon: const Icon(Icons.camera_alt_outlined),
                  label: Text(
                    _photoPath == null ? 'Attach photo' : 'Photo attached',
                  ),
                ),
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: incidentState.isLoading ? null : _submit,
                  icon: const Icon(Icons.send),
                  label: const Text('Submit report'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _pickPhoto() async {
    final file = await ImagePicker().pickImage(source: ImageSource.camera);
    if (!mounted) {
      return;
    }
    setState(() => _photoPath = file?.path);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    final session = ref.read(authControllerProvider).valueOrNull;
    final location = ref.read(trackingControllerProvider).valueOrNull?.lastLocation;
    if (session == null) {
      context.go('/login');
      return;
    }

    await ref.read(incidentControllerProvider.notifier).submit(
          IncidentDraft(
            workerId: session.user.id,
            title: _titleController.text.trim(),
            description: _descriptionController.text.trim(),
            severity: _severity,
            latitude: location?.latitude,
            longitude: location?.longitude,
            photoPath: _photoPath,
          ),
        );
  }
}
