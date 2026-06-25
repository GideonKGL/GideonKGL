import 'dart:async';

import 'package:securitatem_defensionis_guardian_tracker/src/core/config/app_config.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

class SocketService {
  SocketService({required AppConfig config}) : _config = config;

  final AppConfig _config;
  io.Socket? _socket;

  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect({required String accessToken}) async {
    final socket = io.io(
      _config.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth(<String, String>{'token': accessToken})
          .build(),
    );
    final connected = Completer<void>();

    socket
      ..onConnect((_) {
        if (!connected.isCompleted) {
          connected.complete();
        }
      })
      ..onConnectError((error) {
        if (!connected.isCompleted) {
          connected.completeError(error ?? 'Socket connection failed');
        }
      })
      ..connect();

    _socket = socket;
    await connected.future.timeout(const Duration(seconds: 15));
  }

  void emit(String event, Map<String, dynamic> payload) {
    final socket = _socket;
    if (socket == null || !socket.connected) {
      return;
    }
    socket.emit(event, payload);
  }

  Stream<Map<String, dynamic>> on(String event) {
    final controller = StreamController<Map<String, dynamic>>.broadcast();
    _socket?.on(event, (data) {
      if (data is Map<String, dynamic>) {
        controller.add(data);
      } else if (data is Map) {
        controller.add(data.map((key, value) => MapEntry('$key', value)));
      }
    });
    controller.onCancel = () => _socket?.off(event);
    return controller.stream;
  }

  void disconnect() {
    _socket?.dispose();
    _socket = null;
  }
}
