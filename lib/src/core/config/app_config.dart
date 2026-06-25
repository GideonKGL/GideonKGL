class AppConfig {
  const AppConfig({
    required this.apiBaseUrl,
    required this.socketUrl,
    required this.googleMapsApiKey,
  });

  factory AppConfig.fromEnvironment() {
    return const AppConfig(
      apiBaseUrl: String.fromEnvironment(
        'API_BASE_URL',
        defaultValue: 'https://api.securitatem.example.com/v1',
      ),
      socketUrl: String.fromEnvironment(
        'SOCKET_URL',
        defaultValue: 'https://api.securitatem.example.com',
      ),
      googleMapsApiKey: String.fromEnvironment(
        'GOOGLE_MAPS_API_KEY',
        defaultValue: '',
      ),
    );
  }

  final String apiBaseUrl;
  final String socketUrl;
  final String googleMapsApiKey;
}
