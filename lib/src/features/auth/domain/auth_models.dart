class GuardianUser {
  const GuardianUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.badgeNumber,
    this.phoneNumber,
    this.avatarUrl,
  });

  factory GuardianUser.fromJson(Map<String, dynamic> json) {
    return GuardianUser(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'worker',
      badgeNumber: json['badgeNumber']?.toString() ?? '',
      phoneNumber: json['phoneNumber']?.toString(),
      avatarUrl: json['avatarUrl']?.toString(),
    );
  }

  final String id;
  final String name;
  final String email;
  final String role;
  final String badgeNumber;
  final String? phoneNumber;
  final String? avatarUrl;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'badgeNumber': badgeNumber,
      'phoneNumber': phoneNumber,
      'avatarUrl': avatarUrl,
    };
  }

  GuardianUser copyWith({
    String? id,
    String? name,
    String? email,
    String? role,
    String? badgeNumber,
    String? phoneNumber,
    String? avatarUrl,
  }) {
    return GuardianUser(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      badgeNumber: badgeNumber ?? this.badgeNumber,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      avatarUrl: avatarUrl ?? this.avatarUrl,
    );
  }
}

class AuthSession {
  const AuthSession({
    required this.user,
    required this.accessToken,
    this.refreshToken,
    this.pinEnabled = false,
  });

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    final userJson = json['user'];
    return AuthSession(
      user: GuardianUser.fromJson(
        userJson is Map<String, dynamic> ? userJson : <String, dynamic>{},
      ),
      accessToken: json['accessToken']?.toString() ?? '',
      refreshToken: json['refreshToken']?.toString(),
      pinEnabled: json['pinEnabled'] == true,
    );
  }

  final GuardianUser user;
  final String accessToken;
  final String? refreshToken;
  final bool pinEnabled;

  AuthSession copyWith({
    GuardianUser? user,
    String? accessToken,
    String? refreshToken,
    bool? pinEnabled,
  }) {
    return AuthSession(
      user: user ?? this.user,
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
      pinEnabled: pinEnabled ?? this.pinEnabled,
    );
  }
}
