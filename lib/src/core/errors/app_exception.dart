sealed class AppException implements Exception {
  const AppException(this.message, {this.cause});

  final String message;
  final Object? cause;

  @override
  String toString() => message;
}

class NetworkException extends AppException {
  const NetworkException(super.message, {super.cause});
}

class AuthenticationException extends AppException {
  const AuthenticationException(super.message, {super.cause});
}

class PermissionException extends AppException {
  const PermissionException(super.message, {super.cause});
}

class ValidationException extends AppException {
  const ValidationException(super.message, {super.cause});
}
