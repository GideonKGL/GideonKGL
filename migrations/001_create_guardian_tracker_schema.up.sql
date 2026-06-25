-- Securitatem Defensionis Guardian Tracker
-- Complete PostgreSQL schema migration.
--
-- Design notes:
-- - UUID primary keys are generated with pgcrypto.gen_random_uuid().
-- - Soft deletes use deleted_at; uniqueness is enforced with partial indexes.
-- - All application tables include created_at, updated_at, and deleted_at.
-- - GPS and geofencing are represented without mandatory PostGIS dependency so
--   the schema can run on standard PostgreSQL installations.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS guardian;

CREATE OR REPLACE FUNCTION guardian.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TABLE guardian.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_company_id UUID REFERENCES guardian.companies(id) ON DELETE RESTRICT,
    legal_name TEXT NOT NULL,
    trading_name TEXT,
    registration_number TEXT,
    tax_id TEXT,
    industry TEXT,
    email CITEXT,
    phone TEXT,
    website TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state_region TEXT,
    postal_code TEXT,
    country_code CHAR(2),
    timezone TEXT NOT NULL DEFAULT 'UTC',
    status TEXT NOT NULL DEFAULT 'active',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_companies_status
        CHECK (status IN ('active', 'inactive', 'suspended', 'archived')),
    CONSTRAINT ck_companies_country_code
        CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$')
);

CREATE TABLE guardian.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT NOT NULL,
    phone TEXT,
    password_hash TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    display_name TEXT,
    user_type TEXT NOT NULL DEFAULT 'standard',
    status TEXT NOT NULL DEFAULT 'active',
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_users_user_type
        CHECK (user_type IN ('standard', 'worker', 'company_admin', 'system_admin', 'service')),
    CONSTRAINT ck_users_status
        CHECK (status IN ('invited', 'active', 'inactive', 'locked', 'suspended'))
);

CREATE TABLE guardian.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_permissions_code
        CHECK (code = lower(code) AND code ~ '^[a-z0-9_.:-]+$')
);

CREATE TABLE guardian.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES guardian.companies(id) ON DELETE RESTRICT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_roles_code
        CHECK (code = lower(code) AND code ~ '^[a-z0-9_.:-]+$'),
    CONSTRAINT ck_roles_system_company
        CHECK ((is_system_role = TRUE AND company_id IS NULL) OR is_system_role = FALSE)
);

CREATE TABLE guardian.company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES guardian.companies(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES guardian.users(id) ON DELETE RESTRICT,
    employee_number TEXT,
    job_title TEXT,
    department TEXT,
    employment_status TEXT NOT NULL DEFAULT 'active',
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_company_users_employment_status
        CHECK (employment_status IN ('invited', 'active', 'on_leave', 'terminated', 'suspended'))
);

CREATE TABLE guardian.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES guardian.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES guardian.permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE guardian.user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES guardian.companies(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES guardian.users(id) ON DELETE RESTRICT,
    role_id UUID NOT NULL REFERENCES guardian.roles(id) ON DELETE RESTRICT,
    assigned_by_user_id UUID REFERENCES guardian.users(id) ON DELETE SET NULL,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_user_role_assignments_dates
        CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE guardian.workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES guardian.companies(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES guardian.users(id) ON DELETE SET NULL,
    worker_code TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    email CITEXT,
    date_of_birth DATE,
    gender TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    employment_type TEXT NOT NULL DEFAULT 'employee',
    status TEXT NOT NULL DEFAULT 'active',
    hire_date DATE,
    termination_date DATE,
    certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_workers_employment_type
        CHECK (employment_type IN ('employee', 'contractor', 'temporary', 'volunteer')),
    CONSTRAINT ck_workers_status
        CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated', 'suspended')),
    CONSTRAINT ck_workers_termination_date
        CHECK (termination_date IS NULL OR hire_date IS NULL OR termination_date >= hire_date)
);

CREATE TABLE guardian.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES guardian.companies(id) ON DELETE RESTRICT,
    assigned_worker_id UUID REFERENCES guardian.workers(id) ON DELETE SET NULL,
    vehicle_identifier TEXT NOT NULL,
    registration_number TEXT,
    vin TEXT,
    make TEXT,
    model TEXT,
    model_year INTEGER,
    color TEXT,
    vehicle_type TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    insurance_expires_at DATE,
    inspection_expires_at DATE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_vehicles_status
        CHECK (status IN ('active', 'inactive', 'maintenance', 'retired', 'stolen')),
    CONSTRAINT ck_vehicles_model_year
        CHECK (model_year IS NULL OR model_year BETWEEN 1900 AND 2100)
);

CREATE TABLE guardian.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES guardian.companies(id) ON DELETE RESTRICT,
    assigned_worker_id UUID REFERENCES guardian.workers(id) ON DELETE SET NULL,
    assigned_vehicle_id UUID REFERENCES guardian.vehicles(id) ON DELETE SET NULL,
    device_uuid TEXT,
    imei TEXT,
    serial_number TEXT,
    manufacturer TEXT,
    model TEXT,
    os_name TEXT,
    os_version TEXT,
    app_version TEXT,
    phone_number TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    battery_level SMALLINT,
    last_seen_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_devices_status
        CHECK (status IN ('active', 'inactive', 'lost', 'retired', 'maintenance', 'blocked')),
    CONSTRAINT ck_devices_battery_level
        CHECK (battery_level IS NULL OR battery_level BETWEEN 0 AND 100)
);

CREATE TABLE guardian.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES guardian.companies(id) ON DELETE RESTRICT,
    supervisor_user_id UUID REFERENCES guardian.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    site_name TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    scheduled_start_at TIMESTAMPTZ NOT NULL,
    scheduled_end_at TIMESTAMPTZ NOT NULL,
    actual_start_at TIMESTAMPTZ,
    actual_end_at TIMESTAMPTZ,
    location_description TEXT,
    start_latitude NUMERIC(10, 7),
    start_longitude NUMERIC(10, 7),
    end_latitude NUMERIC(10, 7),
    end_longitude NUMERIC(10, 7),
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_shifts_status
        CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'missed')),
    CONSTRAINT ck_shifts_scheduled_dates
        CHECK (scheduled_end_at > scheduled_start_at),
    CONSTRAINT ck_shifts_actual_dates
        CHECK (actual_end_at IS NULL OR actual_start_at IS NULL OR actual_end_at >= actual_start_at),
    CONSTRAINT ck_shifts_start_latitude
        CHECK (start_latitude IS NULL OR start_latitude BETWEEN -90 AND 90),
    CONSTRAINT ck_shifts_start_longitude
        CHECK (start_longitude IS NULL OR start_longitude BETWEEN -180 AND 180),
    CONSTRAINT ck_shifts_end_latitude
        CHECK (end_latitude IS NULL OR end_latitude BETWEEN -90 AND 90),
    CONSTRAINT ck_shifts_end_longitude
        CHECK (end_longitude IS NULL OR end_longitude BETWEEN -180 AND 180)
);

CREATE TABLE guardian.shift_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES guardian.shifts(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES guardian.workers(id) ON DELETE RESTRICT,
    vehicle_id UUID REFERENCES guardian.vehicles(id) ON DELETE SET NULL,
    role_on_shift TEXT,
    status TEXT NOT NULL DEFAULT 'assigned',
    clock_in_at TIMESTAMPTZ,
    clock_out_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_shift_assignments_status
        CHECK (status IN ('assigned', 'accepted', 'declined', 'checked_in', 'checked_out', 'no_show', 'removed')),
    CONSTRAINT ck_shift_assignments_clock_dates
        CHECK (clock_out_at IS NULL OR clock_in_at IS NULL OR clock_out_at >= clock_in_at)
);

CREATE TABLE guardian.gps_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES guardian.companies(id) ON DELETE RESTRICT,
    worker_id UUID REFERENCES guardian.workers(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES guardian.vehicles(id) ON DELETE SET NULL,
    device_id UUID REFERENCES guardian.devices(id) ON DELETE SET NULL,
    shift_id UUID REFERENCES guardian.shifts(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    accuracy_meters NUMERIC(10, 2),
    altitude_meters NUMERIC(10, 2),
    speed_meters_per_second NUMERIC(10, 3),
    heading_degrees NUMERIC(6, 3),
    provider TEXT,
    is_mock_location BOOLEAN NOT NULL DEFAULT FALSE,
    battery_level SMALLINT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_gps_locations_tracking_target
        CHECK (worker_id IS NOT NULL OR vehicle_id IS NOT NULL OR device_id IS NOT NULL),
    CONSTRAINT ck_gps_locations_latitude
        CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT ck_gps_locations_longitude
        CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT ck_gps_locations_accuracy
        CHECK (accuracy_meters IS NULL OR accuracy_meters >= 0),
    CONSTRAINT ck_gps_locations_speed
        CHECK (speed_meters_per_second IS NULL OR speed_meters_per_second >= 0),
    CONSTRAINT ck_gps_locations_heading
        CHECK (heading_degrees IS NULL OR heading_degrees BETWEEN 0 AND 360),
    CONSTRAINT ck_gps_locations_battery_level
        CHECK (battery_level IS NULL OR battery_level BETWEEN 0 AND 100)
);

CREATE TABLE guardian.geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES guardian.companies(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    geofence_type TEXT NOT NULL,
    center_latitude NUMERIC(10, 7),
    center_longitude NUMERIC(10, 7),
    radius_meters NUMERIC(12, 2),
    boundary_geojson JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_geofences_type
        CHECK (geofence_type IN ('circle', 'polygon')),
    CONSTRAINT ck_geofences_circle_shape
        CHECK (
            geofence_type <> 'circle'
            OR (
                center_latitude IS NOT NULL
                AND center_longitude IS NOT NULL
                AND radius_meters IS NOT NULL
                AND radius_meters > 0
            )
        ),
    CONSTRAINT ck_geofences_polygon_shape
        CHECK (geofence_type <> 'polygon' OR boundary_geojson IS NOT NULL),
    CONSTRAINT ck_geofences_center_latitude
        CHECK (center_latitude IS NULL OR center_latitude BETWEEN -90 AND 90),
    CONSTRAINT ck_geofences_center_longitude
        CHECK (center_longitude IS NULL OR center_longitude BETWEEN -180 AND 180),
    CONSTRAINT ck_geofences_valid_dates
        CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from)
);

CREATE TABLE guardian.geofence_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES guardian.companies(id) ON DELETE RESTRICT,
    geofence_id UUID NOT NULL REFERENCES guardian.geofences(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES guardian.workers(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES guardian.vehicles(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES guardian.shifts(id) ON DELETE CASCADE,
    enforcement_mode TEXT NOT NULL DEFAULT 'monitor',
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_geofence_assignments_target
        CHECK (worker_id IS NOT NULL OR vehicle_id IS NOT NULL OR shift_id IS NOT NULL),
    CONSTRAINT ck_geofence_assignments_enforcement_mode
        CHECK (enforcement_mode IN ('monitor', 'required', 'prohibited')),
    CONSTRAINT ck_geofence_assignments_dates
        CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE guardian.geofence_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES guardian.companies(id) ON DELETE RESTRICT,
    geofence_id UUID NOT NULL REFERENCES guardian.geofences(id) ON DELETE RESTRICT,
    assignment_id UUID REFERENCES guardian.geofence_assignments(id) ON DELETE SET NULL,
    worker_id UUID REFERENCES guardian.workers(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES guardian.vehicles(id) ON DELETE SET NULL,
    device_id UUID REFERENCES guardian.devices(id) ON DELETE SET NULL,
    gps_location_id UUID REFERENCES guardian.gps_locations(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    resolved_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_geofence_events_event_type
        CHECK (event_type IN ('enter', 'exit', 'breach', 'dwell', 'unknown')),
    CONSTRAINT ck_geofence_events_latitude
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT ck_geofence_events_longitude
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TABLE guardian.emergency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES guardian.companies(id) ON DELETE RESTRICT,
    raised_by_worker_id UUID REFERENCES guardian.workers(id) ON DELETE SET NULL,
    raised_by_user_id UUID REFERENCES guardian.users(id) ON DELETE SET NULL,
    assigned_to_user_id UUID REFERENCES guardian.users(id) ON DELETE SET NULL,
    related_shift_id UUID REFERENCES guardian.shifts(id) ON DELETE SET NULL,
    related_device_id UUID REFERENCES guardian.devices(id) ON DELETE SET NULL,
    current_gps_location_id UUID REFERENCES guardian.gps_locations(id) ON DELETE SET NULL,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'high',
    status TEXT NOT NULL DEFAULT 'open',
    message TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    raised_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_emergency_alerts_actor
        CHECK (raised_by_worker_id IS NOT NULL OR raised_by_user_id IS NOT NULL),
    CONSTRAINT ck_emergency_alerts_alert_type
        CHECK (alert_type IN ('sos', 'panic', 'man_down', 'medical', 'fire', 'security', 'vehicle', 'other')),
    CONSTRAINT ck_emergency_alerts_severity
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT ck_emergency_alerts_status
        CHECK (status IN ('open', 'acknowledged', 'responding', 'resolved', 'cancelled', 'false_alarm')),
    CONSTRAINT ck_emergency_alerts_latitude
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT ck_emergency_alerts_longitude
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TABLE guardian.emergency_alert_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_alert_id UUID NOT NULL REFERENCES guardian.emergency_alerts(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES guardian.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    note TEXT,
    old_status TEXT,
    new_status TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_emergency_alert_events_event_type
        CHECK (event_type IN ('created', 'acknowledged', 'assigned', 'status_changed', 'note_added', 'resolved', 'cancelled'))
);

CREATE TABLE guardian.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES guardian.companies(id) ON DELETE RESTRICT,
    incident_number TEXT NOT NULL,
    reported_by_user_id UUID REFERENCES guardian.users(id) ON DELETE SET NULL,
    reported_by_worker_id UUID REFERENCES guardian.workers(id) ON DELETE SET NULL,
    assigned_to_user_id UUID REFERENCES guardian.users(id) ON DELETE SET NULL,
    related_shift_id UUID REFERENCES guardian.shifts(id) ON DELETE SET NULL,
    related_vehicle_id UUID REFERENCES guardian.vehicles(id) ON DELETE SET NULL,
    related_geofence_event_id UUID REFERENCES guardian.geofence_events(id) ON DELETE SET NULL,
    related_emergency_alert_id UUID REFERENCES guardian.emergency_alerts(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'reported',
    occurred_at TIMESTAMPTZ,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    location_description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_incidents_reporter
        CHECK (reported_by_user_id IS NOT NULL OR reported_by_worker_id IS NOT NULL),
    CONSTRAINT ck_incidents_severity
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT ck_incidents_status
        CHECK (status IN ('reported', 'triaged', 'investigating', 'resolved', 'closed', 'cancelled')),
    CONSTRAINT ck_incidents_latitude
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT ck_incidents_longitude
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TABLE guardian.incident_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES guardian.incidents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES guardian.users(id) ON DELETE SET NULL,
    worker_id UUID REFERENCES guardian.workers(id) ON DELETE SET NULL,
    participant_role TEXT NOT NULL,
    statement TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_incident_participants_person
        CHECK (user_id IS NOT NULL OR worker_id IS NOT NULL),
    CONSTRAINT ck_incident_participants_role
        CHECK (participant_role IN ('reporter', 'subject', 'witness', 'responder', 'investigator', 'other'))
);

CREATE TABLE guardian.incident_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES guardian.incidents(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES guardian.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'open',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_incident_actions_status
        CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled'))
);

CREATE TABLE guardian.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES guardian.companies(id) ON DELETE RESTRICT,
    report_number TEXT NOT NULL,
    created_by_user_id UUID REFERENCES guardian.users(id) ON DELETE SET NULL,
    worker_id UUID REFERENCES guardian.workers(id) ON DELETE SET NULL,
    incident_id UUID REFERENCES guardian.incidents(id) ON DELETE SET NULL,
    shift_id UUID REFERENCES guardian.shifts(id) ON DELETE SET NULL,
    report_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft',
    reporting_period_start TIMESTAMPTZ,
    reporting_period_end TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    approved_by_user_id UUID REFERENCES guardian.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_reports_type
        CHECK (report_type IN ('daily_activity', 'incident', 'vehicle', 'shift', 'geofence', 'emergency', 'audit', 'custom')),
    CONSTRAINT ck_reports_status
        CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'archived')),
    CONSTRAINT ck_reports_period_dates
        CHECK (reporting_period_end IS NULL OR reporting_period_start IS NULL OR reporting_period_end >= reporting_period_start)
);

CREATE TABLE guardian.evidence_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES guardian.companies(id) ON DELETE RESTRICT,
    uploaded_by_user_id UUID REFERENCES guardian.users(id) ON DELETE SET NULL,
    captured_by_worker_id UUID REFERENCES guardian.workers(id) ON DELETE SET NULL,
    incident_id UUID REFERENCES guardian.incidents(id) ON DELETE SET NULL,
    emergency_alert_id UUID REFERENCES guardian.emergency_alerts(id) ON DELETE SET NULL,
    report_id UUID REFERENCES guardian.reports(id) ON DELETE SET NULL,
    shift_id UUID REFERENCES guardian.shifts(id) ON DELETE SET NULL,
    media_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_provider TEXT NOT NULL DEFAULT 'local',
    storage_key TEXT NOT NULL,
    public_url TEXT,
    checksum_sha256 TEXT,
    duration_seconds NUMERIC(12, 3),
    width_pixels INTEGER,
    height_pixels INTEGER,
    captured_at TIMESTAMPTZ,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_evidence_files_media_type
        CHECK (media_type IN ('photo', 'video', 'audio', 'document')),
    CONSTRAINT ck_evidence_files_size
        CHECK (file_size_bytes > 0),
    CONSTRAINT ck_evidence_files_duration
        CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    CONSTRAINT ck_evidence_files_width
        CHECK (width_pixels IS NULL OR width_pixels > 0),
    CONSTRAINT ck_evidence_files_height
        CHECK (height_pixels IS NULL OR height_pixels > 0),
    CONSTRAINT ck_evidence_files_latitude
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT ck_evidence_files_longitude
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TABLE guardian.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES guardian.companies(id) ON DELETE RESTRICT,
    recipient_user_id UUID REFERENCES guardian.users(id) ON DELETE CASCADE,
    recipient_worker_id UUID REFERENCES guardian.workers(id) ON DELETE CASCADE,
    related_incident_id UUID REFERENCES guardian.incidents(id) ON DELETE SET NULL,
    related_emergency_alert_id UUID REFERENCES guardian.emergency_alerts(id) ON DELETE SET NULL,
    related_report_id UUID REFERENCES guardian.reports(id) ON DELETE SET NULL,
    channel TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    status TEXT NOT NULL DEFAULT 'queued',
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_notifications_recipient
        CHECK (recipient_user_id IS NOT NULL OR recipient_worker_id IS NOT NULL),
    CONSTRAINT ck_notifications_channel
        CHECK (channel IN ('in_app', 'email', 'sms', 'push', 'webhook')),
    CONSTRAINT ck_notifications_priority
        CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    CONSTRAINT ck_notifications_status
        CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed', 'cancelled'))
);

CREATE TABLE guardian.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES guardian.companies(id) ON DELETE SET NULL,
    actor_user_id UUID REFERENCES guardian.users(id) ON DELETE SET NULL,
    actor_worker_id UUID REFERENCES guardian.workers(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_schema TEXT NOT NULL DEFAULT 'guardian',
    entity_table TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    request_id TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_companies_legal_name_active
    ON guardian.companies (lower(legal_name))
    WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_companies_registration_number_active
    ON guardian.companies (registration_number)
    WHERE registration_number IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_companies_parent_company_id
    ON guardian.companies (parent_company_id)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_companies_status
    ON guardian.companies (status)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_companies_metadata_gin
    ON guardian.companies USING GIN (metadata);

CREATE UNIQUE INDEX uq_users_email_active
    ON guardian.users (email)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_users_status
    ON guardian.users (status)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_users_last_login_at
    ON guardian.users (last_login_at DESC);
CREATE INDEX ix_users_metadata_gin
    ON guardian.users USING GIN (metadata);

CREATE UNIQUE INDEX uq_permissions_code_active
    ON guardian.permissions (code)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_permissions_module_action
    ON guardian.permissions (module, action)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_roles_company_code_active
    ON guardian.roles (COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid), code)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_roles_company_id
    ON guardian.roles (company_id)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_company_users_company_user_active
    ON guardian.company_users (company_id, user_id)
    WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_company_users_employee_number_active
    ON guardian.company_users (company_id, employee_number)
    WHERE employee_number IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_company_users_user_id
    ON guardian.company_users (user_id)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_company_users_company_status
    ON guardian.company_users (company_id, employment_status)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_role_permissions_role_permission_active
    ON guardian.role_permissions (role_id, permission_id)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_role_permissions_permission_id
    ON guardian.role_permissions (permission_id)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_user_role_assignments_company_user
    ON guardian.user_role_assignments (company_id, user_id)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_user_role_assignments_role_id
    ON guardian.user_role_assignments (role_id)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_user_role_assignments_assigned_by_user_id
    ON guardian.user_role_assignments (assigned_by_user_id);
CREATE INDEX ix_user_role_assignments_active_dates
    ON guardian.user_role_assignments (starts_at, ends_at)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_workers_company_worker_code_active
    ON guardian.workers (company_id, worker_code)
    WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_workers_user_id_active
    ON guardian.workers (user_id)
    WHERE user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_workers_company_status
    ON guardian.workers (company_id, status)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_workers_email
    ON guardian.workers (email)
    WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_workers_metadata_gin
    ON guardian.workers USING GIN (metadata);

CREATE UNIQUE INDEX uq_vehicles_company_identifier_active
    ON guardian.vehicles (company_id, vehicle_identifier)
    WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_vehicles_company_registration_active
    ON guardian.vehicles (company_id, registration_number)
    WHERE registration_number IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX uq_vehicles_vin_active
    ON guardian.vehicles (vin)
    WHERE vin IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_vehicles_company_status
    ON guardian.vehicles (company_id, status)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_vehicles_assigned_worker_id
    ON guardian.vehicles (assigned_worker_id)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_devices_device_uuid_active
    ON guardian.devices (device_uuid)
    WHERE device_uuid IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX uq_devices_imei_active
    ON guardian.devices (imei)
    WHERE imei IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX uq_devices_serial_number_active
    ON guardian.devices (serial_number)
    WHERE serial_number IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_devices_company_status
    ON guardian.devices (company_id, status)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_devices_assigned_worker_id
    ON guardian.devices (assigned_worker_id)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_devices_assigned_vehicle_id
    ON guardian.devices (assigned_vehicle_id)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_devices_last_seen_at
    ON guardian.devices (last_seen_at DESC);

CREATE INDEX ix_shifts_company_schedule
    ON guardian.shifts (company_id, scheduled_start_at, scheduled_end_at)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_shifts_company_status
    ON guardian.shifts (company_id, status)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_shifts_supervisor_user_id
    ON guardian.shifts (supervisor_user_id)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_shift_assignments_shift_worker_active
    ON guardian.shift_assignments (shift_id, worker_id)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_shift_assignments_worker_id
    ON guardian.shift_assignments (worker_id)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_shift_assignments_vehicle_id
    ON guardian.shift_assignments (vehicle_id)
    WHERE vehicle_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_shift_assignments_status
    ON guardian.shift_assignments (status)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_gps_locations_company_recorded_at
    ON guardian.gps_locations (company_id, recorded_at DESC)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_gps_locations_worker_recorded_at
    ON guardian.gps_locations (worker_id, recorded_at DESC)
    WHERE worker_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_gps_locations_vehicle_recorded_at
    ON guardian.gps_locations (vehicle_id, recorded_at DESC)
    WHERE vehicle_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_gps_locations_device_recorded_at
    ON guardian.gps_locations (device_id, recorded_at DESC)
    WHERE device_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_gps_locations_shift_id
    ON guardian.gps_locations (shift_id)
    WHERE shift_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_gps_locations_latitude_longitude
    ON guardian.gps_locations (latitude, longitude)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_gps_locations_recorded_at_brin
    ON guardian.gps_locations USING BRIN (recorded_at);

CREATE INDEX ix_geofences_company_active
    ON guardian.geofences (company_id, is_active)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_geofences_name
    ON guardian.geofences (company_id, lower(name))
    WHERE deleted_at IS NULL;
CREATE INDEX ix_geofences_boundary_geojson_gin
    ON guardian.geofences USING GIN (boundary_geojson)
    WHERE boundary_geojson IS NOT NULL;

CREATE INDEX ix_geofence_assignments_geofence_id
    ON guardian.geofence_assignments (geofence_id)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_geofence_assignments_worker_id
    ON guardian.geofence_assignments (worker_id)
    WHERE worker_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_geofence_assignments_vehicle_id
    ON guardian.geofence_assignments (vehicle_id)
    WHERE vehicle_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_geofence_assignments_shift_id
    ON guardian.geofence_assignments (shift_id)
    WHERE shift_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_geofence_assignments_dates
    ON guardian.geofence_assignments (starts_at, ends_at)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_geofence_events_company_occurred_at
    ON guardian.geofence_events (company_id, occurred_at DESC)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_geofence_events_geofence_id
    ON guardian.geofence_events (geofence_id)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_geofence_events_worker_occurred_at
    ON guardian.geofence_events (worker_id, occurred_at DESC)
    WHERE worker_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_geofence_events_vehicle_occurred_at
    ON guardian.geofence_events (vehicle_id, occurred_at DESC)
    WHERE vehicle_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_geofence_events_gps_location_id
    ON guardian.geofence_events (gps_location_id)
    WHERE gps_location_id IS NOT NULL;

CREATE INDEX ix_emergency_alerts_company_status
    ON guardian.emergency_alerts (company_id, status)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_emergency_alerts_company_raised_at
    ON guardian.emergency_alerts (company_id, raised_at DESC)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_emergency_alerts_worker_id
    ON guardian.emergency_alerts (raised_by_worker_id)
    WHERE raised_by_worker_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_emergency_alerts_assigned_to_user_id
    ON guardian.emergency_alerts (assigned_to_user_id)
    WHERE assigned_to_user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_emergency_alerts_current_gps_location_id
    ON guardian.emergency_alerts (current_gps_location_id)
    WHERE current_gps_location_id IS NOT NULL;

CREATE INDEX ix_emergency_alert_events_alert_occurred_at
    ON guardian.emergency_alert_events (emergency_alert_id, occurred_at DESC)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_emergency_alert_events_actor_user_id
    ON guardian.emergency_alert_events (actor_user_id)
    WHERE actor_user_id IS NOT NULL;

CREATE UNIQUE INDEX uq_incidents_company_incident_number_active
    ON guardian.incidents (company_id, incident_number)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_incidents_company_status
    ON guardian.incidents (company_id, status)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_incidents_company_reported_at
    ON guardian.incidents (company_id, reported_at DESC)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_incidents_assigned_to_user_id
    ON guardian.incidents (assigned_to_user_id)
    WHERE assigned_to_user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_incidents_related_shift_id
    ON guardian.incidents (related_shift_id)
    WHERE related_shift_id IS NOT NULL;
CREATE INDEX ix_incidents_related_emergency_alert_id
    ON guardian.incidents (related_emergency_alert_id)
    WHERE related_emergency_alert_id IS NOT NULL;
CREATE INDEX ix_incidents_metadata_gin
    ON guardian.incidents USING GIN (metadata);

CREATE INDEX ix_incident_participants_incident_id
    ON guardian.incident_participants (incident_id)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_incident_participants_user_id
    ON guardian.incident_participants (user_id)
    WHERE user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_incident_participants_worker_id
    ON guardian.incident_participants (worker_id)
    WHERE worker_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX ix_incident_actions_incident_status
    ON guardian.incident_actions (incident_id, status)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_incident_actions_actor_user_id
    ON guardian.incident_actions (actor_user_id)
    WHERE actor_user_id IS NOT NULL;
CREATE INDEX ix_incident_actions_due_at
    ON guardian.incident_actions (due_at)
    WHERE due_at IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX uq_reports_company_report_number_active
    ON guardian.reports (company_id, report_number)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_reports_company_type_status
    ON guardian.reports (company_id, report_type, status)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_reports_created_by_user_id
    ON guardian.reports (created_by_user_id)
    WHERE created_by_user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_reports_worker_id
    ON guardian.reports (worker_id)
    WHERE worker_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_reports_incident_id
    ON guardian.reports (incident_id)
    WHERE incident_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_reports_shift_id
    ON guardian.reports (shift_id)
    WHERE shift_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_reports_content_gin
    ON guardian.reports USING GIN (content);

CREATE UNIQUE INDEX uq_evidence_files_storage_key_active
    ON guardian.evidence_files (storage_provider, storage_key)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_evidence_files_company_media_type
    ON guardian.evidence_files (company_id, media_type)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_evidence_files_incident_id
    ON guardian.evidence_files (incident_id)
    WHERE incident_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_evidence_files_emergency_alert_id
    ON guardian.evidence_files (emergency_alert_id)
    WHERE emergency_alert_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_evidence_files_report_id
    ON guardian.evidence_files (report_id)
    WHERE report_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_evidence_files_captured_by_worker_id
    ON guardian.evidence_files (captured_by_worker_id)
    WHERE captured_by_worker_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_evidence_files_captured_at
    ON guardian.evidence_files (captured_at DESC)
    WHERE captured_at IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX ix_notifications_recipient_user_status
    ON guardian.notifications (recipient_user_id, status)
    WHERE recipient_user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_notifications_recipient_worker_status
    ON guardian.notifications (recipient_worker_id, status)
    WHERE recipient_worker_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_notifications_company_created_at
    ON guardian.notifications (company_id, created_at DESC)
    WHERE company_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_notifications_scheduled_at
    ON guardian.notifications (scheduled_at)
    WHERE scheduled_at IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_notifications_related_incident_id
    ON guardian.notifications (related_incident_id)
    WHERE related_incident_id IS NOT NULL;
CREATE INDEX ix_notifications_related_emergency_alert_id
    ON guardian.notifications (related_emergency_alert_id)
    WHERE related_emergency_alert_id IS NOT NULL;

CREATE INDEX ix_audit_logs_company_occurred_at
    ON guardian.audit_logs (company_id, occurred_at DESC);
CREATE INDEX ix_audit_logs_actor_user_occurred_at
    ON guardian.audit_logs (actor_user_id, occurred_at DESC)
    WHERE actor_user_id IS NOT NULL;
CREATE INDEX ix_audit_logs_actor_worker_occurred_at
    ON guardian.audit_logs (actor_worker_id, occurred_at DESC)
    WHERE actor_worker_id IS NOT NULL;
CREATE INDEX ix_audit_logs_entity
    ON guardian.audit_logs (entity_schema, entity_table, entity_id);
CREATE INDEX ix_audit_logs_request_id
    ON guardian.audit_logs (request_id)
    WHERE request_id IS NOT NULL;
CREATE INDEX ix_audit_logs_old_values_gin
    ON guardian.audit_logs USING GIN (old_values)
    WHERE old_values IS NOT NULL;
CREATE INDEX ix_audit_logs_new_values_gin
    ON guardian.audit_logs USING GIN (new_values)
    WHERE new_values IS NOT NULL;

CREATE TRIGGER trg_companies_set_updated_at
    BEFORE UPDATE ON guardian.companies
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_users_set_updated_at
    BEFORE UPDATE ON guardian.users
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_permissions_set_updated_at
    BEFORE UPDATE ON guardian.permissions
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_roles_set_updated_at
    BEFORE UPDATE ON guardian.roles
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_company_users_set_updated_at
    BEFORE UPDATE ON guardian.company_users
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_role_permissions_set_updated_at
    BEFORE UPDATE ON guardian.role_permissions
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_user_role_assignments_set_updated_at
    BEFORE UPDATE ON guardian.user_role_assignments
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_workers_set_updated_at
    BEFORE UPDATE ON guardian.workers
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_vehicles_set_updated_at
    BEFORE UPDATE ON guardian.vehicles
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_devices_set_updated_at
    BEFORE UPDATE ON guardian.devices
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_shifts_set_updated_at
    BEFORE UPDATE ON guardian.shifts
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_shift_assignments_set_updated_at
    BEFORE UPDATE ON guardian.shift_assignments
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_gps_locations_set_updated_at
    BEFORE UPDATE ON guardian.gps_locations
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_geofences_set_updated_at
    BEFORE UPDATE ON guardian.geofences
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_geofence_assignments_set_updated_at
    BEFORE UPDATE ON guardian.geofence_assignments
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_geofence_events_set_updated_at
    BEFORE UPDATE ON guardian.geofence_events
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_emergency_alerts_set_updated_at
    BEFORE UPDATE ON guardian.emergency_alerts
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_emergency_alert_events_set_updated_at
    BEFORE UPDATE ON guardian.emergency_alert_events
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_incidents_set_updated_at
    BEFORE UPDATE ON guardian.incidents
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_incident_participants_set_updated_at
    BEFORE UPDATE ON guardian.incident_participants
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_incident_actions_set_updated_at
    BEFORE UPDATE ON guardian.incident_actions
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_reports_set_updated_at
    BEFORE UPDATE ON guardian.reports
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_evidence_files_set_updated_at
    BEFORE UPDATE ON guardian.evidence_files
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_notifications_set_updated_at
    BEFORE UPDATE ON guardian.notifications
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();
CREATE TRIGGER trg_audit_logs_set_updated_at
    BEFORE UPDATE ON guardian.audit_logs
    FOR EACH ROW EXECUTE FUNCTION guardian.set_updated_at();

COMMIT;
