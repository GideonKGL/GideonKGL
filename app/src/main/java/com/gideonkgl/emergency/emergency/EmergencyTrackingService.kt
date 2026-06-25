package com.gideonkgl.emergency.emergency

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import com.gideonkgl.emergency.MainActivity
import com.gideonkgl.emergency.R

class EmergencyTrackingService : Service() {
    private lateinit var logger: EmergencyLogger
    private lateinit var coordinator: EmergencyCoordinator
    private lateinit var locationProvider: LocationProvider
    private lateinit var geofenceMonitor: GeofenceMonitor
    private lateinit var stateStore: EmergencyStateStore
    private val mainHandler = Handler(Looper.getMainLooper())
    private var locationHandle: LocationUpdateHandle? = null
    private var shakeDetector: ShakeDetector? = null
    private var lastLocation: EmergencyLocation? = null
    private val trackingTicker = object : Runnable {
        override fun run() {
            if (stateStore.activeEmergencyId() != null) {
                lastLocation?.let { coordinator.sendTrackingUpdate(it) }
                mainHandler.postDelayed(this, TRACKING_INTERVAL_MS)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        logger = EmergencyLogger(this)
        coordinator = EmergencyCoordinator(this)
        locationProvider = LocationProvider(this, logger)
        stateStore = EmergencyStateStore(this)
        geofenceMonitor = GeofenceMonitor(GeofenceStore(this), logger) { geofence, distance ->
            coordinator.triggerEmergency(
                EmergencyTrigger(
                    type = EmergencyTriggerType.GEOFENCE_VIOLATION,
                    source = "foreground_service",
                    metadata = mapOf(
                        "geofenceName" to geofence.name,
                        "distanceMeters" to distance.toString(),
                        "radiusMeters" to geofence.radiusMeters.toString()
                    )
                )
            )
        }
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopMonitoring()
                stateStore.clearActiveEmergency()
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_START_TRACKING -> {
                val emergencyId = intent.getStringExtra(EXTRA_EMERGENCY_ID)
                if (emergencyId != null) {
                    stateStore.setActiveEmergency(
                        emergencyId,
                        intent.getStringExtra(EXTRA_INCIDENT_ID)
                    )
                }
                startForegroundWithNotification(trackingActive = true)
                startMonitoring()
            }
            else -> {
                startForegroundWithNotification(trackingActive = stateStore.activeEmergencyId() != null)
                startMonitoring()
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        stopMonitoring()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startMonitoring() {
        if (locationHandle == null) {
            locationHandle = locationProvider.startLocationUpdates(TRACKING_INTERVAL_MS) { location ->
                lastLocation = location
                geofenceMonitor.evaluate(location)
            }
            locationProvider.getCurrentLocation { location ->
                location?.let {
                    lastLocation = it
                    geofenceMonitor.evaluate(it)
                }
            }
        }

        if (shakeDetector == null) {
            shakeDetector = ShakeDetector(this, logger) {
                coordinator.triggerEmergency(
                    EmergencyTrigger(
                        type = EmergencyTriggerType.DEVICE_SHAKE,
                        source = "foreground_service"
                    )
                )
            }.also { detector ->
                if (!detector.start()) {
                    shakeDetector = null
                }
            }
        }

        logger.event(
            "emergency_monitoring_started",
            mapOf("trackingActive" to (stateStore.activeEmergencyId() != null))
        )
        startTrackingTickerIfNeeded()
    }

    private fun stopMonitoring() {
        mainHandler.removeCallbacks(trackingTicker)
        locationHandle?.stop()
        locationHandle = null
        shakeDetector?.stop()
        shakeDetector = null
        logger.event("emergency_monitoring_stopped")
    }

    private fun startTrackingTickerIfNeeded() {
        if (stateStore.activeEmergencyId() == null) return
        mainHandler.removeCallbacks(trackingTicker)
        mainHandler.post(trackingTicker)
    }

    private fun startForegroundWithNotification(trackingActive: Boolean) {
        val notification = buildNotification(trackingActive)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
            locationProvider.hasForegroundLocationPermission()
        ) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun buildNotification(trackingActive: Boolean): Notification {
        val launchIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val stopIntent = PendingIntent.getService(
            this,
            1,
            Intent(this, EmergencyTrackingService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val title = if (trackingActive) "Emergency tracking active" else "Safety monitoring active"
        val text = if (trackingActive) {
            "Location is being sent every 5 seconds."
        } else {
            "Shake and geofence monitoring are running."
        }

        return Notification.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher)
            .setContentTitle(title)
            .setContentText(text)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .addAction(R.drawable.ic_launcher, "Stop", stopIntent)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Emergency response",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Visible emergency monitoring and tracking status"
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    companion object {
        private const val CHANNEL_ID = "emergency_response"
        private const val NOTIFICATION_ID = 7007
        private const val TRACKING_INTERVAL_MS = 5_000L
        private const val ACTION_START_MONITORING = "com.gideonkgl.emergency.START_MONITORING"
        private const val ACTION_START_TRACKING = "com.gideonkgl.emergency.START_TRACKING"
        private const val ACTION_STOP = "com.gideonkgl.emergency.STOP_MONITORING"
        private const val EXTRA_EMERGENCY_ID = "extra_emergency_id"
        private const val EXTRA_INCIDENT_ID = "extra_incident_id"

        fun monitoringIntent(context: Context): Intent =
            Intent(context, EmergencyTrackingService::class.java).setAction(ACTION_START_MONITORING)

        fun trackingIntent(context: Context, emergencyId: String, incidentId: String?): Intent =
            Intent(context, EmergencyTrackingService::class.java)
                .setAction(ACTION_START_TRACKING)
                .putExtra(EXTRA_EMERGENCY_ID, emergencyId)
                .putExtra(EXTRA_INCIDENT_ID, incidentId)

        fun stopIntent(context: Context): Intent =
            Intent(context, EmergencyTrackingService::class.java).setAction(ACTION_STOP)
    }
}
