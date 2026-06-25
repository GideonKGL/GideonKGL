import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    ref.listen(authControllerProvider, (_, next) {
      if (next.value == true) {
        context.go('/home');
      }
    });

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 48),
            const Text('SECURITATEM DEFENSIONIS', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const Text('Guardian Tracker', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800)),
            const SizedBox(height: 32),
            TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email')),
            TextField(controller: _password, decoration: const InputDecoration(labelText: 'Password'), obscureText: true),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: auth.isLoading ? null : () => ref.read(authControllerProvider.notifier).login(_email.text, _password.text),
              child: auth.isLoading ? const CircularProgressIndicator() : const Text('Login'),
            ),
            TextButton(onPressed: () => context.go('/pin-login'), child: const Text('Login with 6 digit PIN')),
            TextButton(onPressed: () => context.go('/register'), child: const Text('Create account')),
            TextButton(onPressed: () => context.go('/password-reset'), child: const Text('Reset password')),
            if (auth.hasError) Text('${auth.error}', style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
        ),
      ),
    );
  }
}

class PinLoginScreen extends ConsumerStatefulWidget {
  const PinLoginScreen({super.key});

  @override
  ConsumerState<PinLoginScreen> createState() => _PinLoginScreenState();
}

class _PinLoginScreenState extends ConsumerState<PinLoginScreen> {
  final _email = TextEditingController();
  final _pin = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('PIN Login')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email')),
          TextField(
            controller: _pin,
            decoration: const InputDecoration(labelText: '6 Digit PIN'),
            keyboardType: TextInputType.number,
            maxLength: 6,
            obscureText: true,
          ),
          FilledButton(
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).pinLogin(_email.text, _pin.text);
              if (context.mounted) context.go('/home');
            },
            child: const Text('Unlock'),
          ),
        ],
      ),
    );
  }
}

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _phone = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Registration')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          TextField(controller: _firstName, decoration: const InputDecoration(labelText: 'First name')),
          TextField(controller: _lastName, decoration: const InputDecoration(labelText: 'Last name')),
          TextField(controller: _phone, decoration: const InputDecoration(labelText: 'Phone')),
          TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email')),
          TextField(controller: _password, decoration: const InputDecoration(labelText: 'Password'), obscureText: true),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).register({
                'email': _email.text,
                'password': _password.text,
                'firstName': _firstName.text,
                'lastName': _lastName.text,
                'phone': _phone.text,
              });
              if (context.mounted) context.go('/home');
            },
            child: const Text('Register'),
          ),
        ],
      ),
    );
  }
}

class PasswordResetScreen extends StatelessWidget {
  const PasswordResetScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final email = TextEditingController();
    return Scaffold(
      appBar: AppBar(title: const Text('Password Reset')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          TextField(controller: email, decoration: const InputDecoration(labelText: 'Email')),
          const SizedBox(height: 24),
          FilledButton(onPressed: () => context.pop(), child: const Text('Request reset')),
        ],
      ),
    );
  }
}
