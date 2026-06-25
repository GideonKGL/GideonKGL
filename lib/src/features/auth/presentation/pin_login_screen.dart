import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:securitatem_defensionis_guardian_tracker/src/features/auth/presentation/auth_controller.dart';

class PinLoginScreen extends ConsumerStatefulWidget {
  const PinLoginScreen({super.key});

  @override
  ConsumerState<PinLoginScreen> createState() => _PinLoginScreenState();
}

class _PinLoginScreenState extends ConsumerState<PinLoginScreen> {
  final _pinController = TextEditingController();

  @override
  void dispose() {
    _pinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authControllerProvider, (previous, next) {
      next.whenOrNull(
        data: (session) {
          if (session != null) {
            context.go('/dashboard');
          }
        },
        error: (error, _) => _showError(context, error.toString()),
      );
    });

    final isLoading = ref.watch(authControllerProvider).isLoading;

    return Scaffold(
      appBar: AppBar(title: const Text('PIN Login')),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 360),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(Icons.pin_outlined, size: 64),
                  const SizedBox(height: 24),
                  TextField(
                    controller: _pinController,
                    obscureText: true,
                    maxLength: 6,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineMedium,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(6),
                    ],
                    decoration: const InputDecoration(
                      counterText: '',
                      labelText: '6 digit PIN',
                    ),
                    onSubmitted: (_) => _submit(),
                  ),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: isLoading ? null : _submit,
                    child: const Text('Unlock'),
                  ),
                  TextButton(
                    onPressed: isLoading ? null : () => context.go('/login'),
                    child: const Text('Use email and password'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    await ref
        .read(authControllerProvider.notifier)
        .loginWithPin(_pinController.text);
  }

  void _showError(BuildContext context, String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }
}
