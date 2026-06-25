import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/auth/presentation/auth_controller.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/profile/presentation/profile_controller.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _pinController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(authControllerProvider).valueOrNull;
    final profileState = ref.watch(profileControllerProvider);

    if (session == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    _nameController.text = _nameController.text.isEmpty
        ? session.user.name
        : _nameController.text;
    _phoneController.text = _phoneController.text.isEmpty
        ? session.user.phoneNumber ?? ''
        : _phoneController.text;

    ref.listen(profileControllerProvider, (previous, next) {
      next.whenOrNull(
        data: (user) {
          if (user != null) {
            ref.read(authControllerProvider.notifier).updateCurrentUser(user);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Profile updated.')),
            );
          }
        },
        error: (error, _) => ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        ),
      );
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Profile Management')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            CircleAvatar(
              radius: 42,
              child: Text(
                session.user.name.isNotEmpty ? session.user.name[0] : 'G',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              session.user.email,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            Text(
              'Badge ${session.user.badgeNumber}',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Full name',
                prefixIcon: Icon(Icons.person_outline),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Phone number',
                prefixIcon: Icon(Icons.phone_outlined),
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: profileState.isLoading ? null : _saveProfile,
              icon: const Icon(Icons.save_outlined),
              label: const Text('Save profile'),
            ),
            const Divider(height: 40),
            TextField(
              controller: _pinController,
              obscureText: true,
              maxLength: 6,
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
              decoration: const InputDecoration(
                counterText: '',
                labelText: 'Set 6 digit PIN',
                prefixIcon: Icon(Icons.pin_outlined),
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _enablePin,
              icon: const Icon(Icons.lock_outline),
              label: Text(session.pinEnabled ? 'Update PIN' : 'Enable PIN'),
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: () async {
                await ref.read(authControllerProvider.notifier).logout();
                if (context.mounted) {
                  context.go('/login');
                }
              },
              icon: const Icon(Icons.logout),
              label: const Text('Sign out'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _saveProfile() async {
    await ref.read(profileControllerProvider.notifier).updateProfile(
          name: _nameController.text,
          phoneNumber: _phoneController.text,
        );
  }

  Future<void> _enablePin() async {
    await ref.read(authControllerProvider.notifier).enablePin(
          _pinController.text,
        );
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('PIN enabled.')),
      );
    }
  }
}
