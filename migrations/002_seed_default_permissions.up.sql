-- Seed baseline enterprise permissions for Guardian Tracker modules.

BEGIN;

WITH permission_seed (code, name, description, module, action) AS (
    VALUES
        ('users.view', 'View users', 'View user accounts and profiles.', 'users', 'view'),
        ('users.create', 'Create users', 'Create user accounts.', 'users', 'create'),
        ('users.update', 'Update users', 'Update user accounts and profiles.', 'users', 'update'),
        ('users.delete', 'Delete users', 'Soft delete user accounts.', 'users', 'delete'),
        ('users.manage', 'Manage users', 'Full user administration.', 'users', 'manage'),

        ('companies.view', 'View companies', 'View company records.', 'companies', 'view'),
        ('companies.create', 'Create companies', 'Create company records.', 'companies', 'create'),
        ('companies.update', 'Update companies', 'Update company records.', 'companies', 'update'),
        ('companies.delete', 'Delete companies', 'Soft delete company records.', 'companies', 'delete'),
        ('companies.manage', 'Manage companies', 'Full company administration.', 'companies', 'manage'),

        ('roles.view', 'View roles', 'View roles.', 'roles', 'view'),
        ('roles.create', 'Create roles', 'Create roles.', 'roles', 'create'),
        ('roles.update', 'Update roles', 'Update roles.', 'roles', 'update'),
        ('roles.delete', 'Delete roles', 'Soft delete roles.', 'roles', 'delete'),
        ('roles.manage', 'Manage roles', 'Full role administration.', 'roles', 'manage'),

        ('permissions.view', 'View permissions', 'View permissions.', 'permissions', 'view'),
        ('permissions.create', 'Create permissions', 'Create permissions.', 'permissions', 'create'),
        ('permissions.update', 'Update permissions', 'Update permissions.', 'permissions', 'update'),
        ('permissions.delete', 'Delete permissions', 'Soft delete permissions.', 'permissions', 'delete'),
        ('permissions.manage', 'Manage permissions', 'Full permission administration.', 'permissions', 'manage'),

        ('gps_tracking.view', 'View GPS tracking', 'View GPS tracking history and live positions.', 'gps_tracking', 'view'),
        ('gps_tracking.create', 'Create GPS tracking', 'Create GPS location records.', 'gps_tracking', 'create'),
        ('gps_tracking.update', 'Update GPS tracking', 'Update GPS location records.', 'gps_tracking', 'update'),
        ('gps_tracking.delete', 'Delete GPS tracking', 'Soft delete GPS location records.', 'gps_tracking', 'delete'),
        ('gps_tracking.manage', 'Manage GPS tracking', 'Full GPS tracking administration.', 'gps_tracking', 'manage'),

        ('geofencing.view', 'View geofencing', 'View geofences, assignments, and events.', 'geofencing', 'view'),
        ('geofencing.create', 'Create geofencing', 'Create geofences and assignments.', 'geofencing', 'create'),
        ('geofencing.update', 'Update geofencing', 'Update geofences and assignments.', 'geofencing', 'update'),
        ('geofencing.delete', 'Delete geofencing', 'Soft delete geofences and assignments.', 'geofencing', 'delete'),
        ('geofencing.manage', 'Manage geofencing', 'Full geofencing administration.', 'geofencing', 'manage'),

        ('emergency_alerts.view', 'View emergency alerts', 'View emergency alerts and response history.', 'emergency_alerts', 'view'),
        ('emergency_alerts.create', 'Create emergency alerts', 'Raise emergency alerts.', 'emergency_alerts', 'create'),
        ('emergency_alerts.update', 'Update emergency alerts', 'Update emergency alert status and assignments.', 'emergency_alerts', 'update'),
        ('emergency_alerts.delete', 'Delete emergency alerts', 'Soft delete emergency alerts.', 'emergency_alerts', 'delete'),
        ('emergency_alerts.manage', 'Manage emergency alerts', 'Full emergency alert administration.', 'emergency_alerts', 'manage'),

        ('incidents.view', 'View incidents', 'View incident records.', 'incidents', 'view'),
        ('incidents.create', 'Create incidents', 'Create incident records.', 'incidents', 'create'),
        ('incidents.update', 'Update incidents', 'Update incident records.', 'incidents', 'update'),
        ('incidents.delete', 'Delete incidents', 'Soft delete incident records.', 'incidents', 'delete'),
        ('incidents.manage', 'Manage incidents', 'Full incident administration.', 'incidents', 'manage'),

        ('vehicles.view', 'View vehicles', 'View vehicle records.', 'vehicles', 'view'),
        ('vehicles.create', 'Create vehicles', 'Create vehicle records.', 'vehicles', 'create'),
        ('vehicles.update', 'Update vehicles', 'Update vehicle records.', 'vehicles', 'update'),
        ('vehicles.delete', 'Delete vehicles', 'Soft delete vehicle records.', 'vehicles', 'delete'),
        ('vehicles.manage', 'Manage vehicles', 'Full vehicle administration.', 'vehicles', 'manage'),

        ('workers.view', 'View workers', 'View worker records.', 'workers', 'view'),
        ('workers.create', 'Create workers', 'Create worker records.', 'workers', 'create'),
        ('workers.update', 'Update workers', 'Update worker records.', 'workers', 'update'),
        ('workers.delete', 'Delete workers', 'Soft delete worker records.', 'workers', 'delete'),
        ('workers.manage', 'Manage workers', 'Full worker administration.', 'workers', 'manage'),

        ('shifts.view', 'View shifts', 'View shifts and assignments.', 'shifts', 'view'),
        ('shifts.create', 'Create shifts', 'Create shifts and assignments.', 'shifts', 'create'),
        ('shifts.update', 'Update shifts', 'Update shifts and assignments.', 'shifts', 'update'),
        ('shifts.delete', 'Delete shifts', 'Soft delete shifts and assignments.', 'shifts', 'delete'),
        ('shifts.manage', 'Manage shifts', 'Full shift administration.', 'shifts', 'manage'),

        ('devices.view', 'View devices', 'View device information.', 'devices', 'view'),
        ('devices.create', 'Create devices', 'Create device records.', 'devices', 'create'),
        ('devices.update', 'Update devices', 'Update device records.', 'devices', 'update'),
        ('devices.delete', 'Delete devices', 'Soft delete device records.', 'devices', 'delete'),
        ('devices.manage', 'Manage devices', 'Full device administration.', 'devices', 'manage'),

        ('evidence.view', 'View evidence', 'View photo, video, audio, and document evidence.', 'evidence', 'view'),
        ('evidence.create', 'Create evidence', 'Upload photo, video, audio, and document evidence.', 'evidence', 'create'),
        ('evidence.update', 'Update evidence', 'Update evidence metadata.', 'evidence', 'update'),
        ('evidence.delete', 'Delete evidence', 'Soft delete evidence files.', 'evidence', 'delete'),
        ('evidence.manage', 'Manage evidence', 'Full evidence administration.', 'evidence', 'manage'),

        ('reports.view', 'View reports', 'View reports.', 'reports', 'view'),
        ('reports.create', 'Create reports', 'Create reports.', 'reports', 'create'),
        ('reports.update', 'Update reports', 'Update reports.', 'reports', 'update'),
        ('reports.delete', 'Delete reports', 'Soft delete reports.', 'reports', 'delete'),
        ('reports.manage', 'Manage reports', 'Full report administration.', 'reports', 'manage'),

        ('notifications.view', 'View notifications', 'View notification records.', 'notifications', 'view'),
        ('notifications.create', 'Create notifications', 'Create and queue notifications.', 'notifications', 'create'),
        ('notifications.update', 'Update notifications', 'Update notification status.', 'notifications', 'update'),
        ('notifications.delete', 'Delete notifications', 'Soft delete notification records.', 'notifications', 'delete'),
        ('notifications.manage', 'Manage notifications', 'Full notification administration.', 'notifications', 'manage'),

        ('audit_logs.view', 'View audit logs', 'View audit logs.', 'audit_logs', 'view'),
        ('audit_logs.create', 'Create audit logs', 'Create audit log records.', 'audit_logs', 'create'),
        ('audit_logs.update', 'Update audit logs', 'Update audit log metadata.', 'audit_logs', 'update'),
        ('audit_logs.delete', 'Delete audit logs', 'Soft delete audit log records.', 'audit_logs', 'delete'),
        ('audit_logs.manage', 'Manage audit logs', 'Full audit log administration.', 'audit_logs', 'manage')
),
updated_permissions AS (
    UPDATE guardian.permissions p
    SET
        name = s.name,
        description = s.description,
        module = s.module,
        action = s.action,
        deleted_at = NULL
    FROM permission_seed s
    WHERE p.code = s.code
    RETURNING p.code
)
INSERT INTO guardian.permissions (code, name, description, module, action)
SELECT s.code, s.name, s.description, s.module, s.action
FROM permission_seed s
WHERE NOT EXISTS (
    SELECT 1
    FROM guardian.permissions p
    WHERE p.code = s.code
);

COMMIT;
