sealed class Result<T> {
  const Result();

  R when<R>({
    required R Function(T value) success,
    required R Function(Object error, StackTrace stackTrace) failure,
  }) {
    return switch (this) {
      Success<T>(:final value) => success(value),
      Failure<T>(:final error, :final stackTrace) => failure(error, stackTrace),
    };
  }
}

class Success<T> extends Result<T> {
  const Success(this.value);

  final T value;
}

class Failure<T> extends Result<T> {
  const Failure(this.error, this.stackTrace);

  final Object error;
  final StackTrace stackTrace;
}
