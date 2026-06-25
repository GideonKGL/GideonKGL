package com.gideonkgl.emergency

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.KeyEvent
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import com.gideonkgl.emergency.emergency.EmergencyCoordinator
import com.gideonkgl.emergency.emergency.EmergencyGeofence
import com.gideonkgl.emergency.emergency.EmergencyLogger
import com.gideonkgl.emergency.emergency.EmergencyTrackingService
import com.gideonkgl.emergency.emergency.EmergencyTrigger
import com.gideonkgl.emergency.emergency.EmergencyTriggerType
import com.gideonkgl.emergency.emergency.EvidenceRegistry
import com.gideonkgl.emergency.emergency.GeofenceStore
import com.gideonkgl.emergency.emergency.LocationProvider
import com.gideonkgl.emergency.emergency.ShakeDetector
import com.gideonkgl.emergency.emergency.VolumeUpPressDetector

class MainActivity : Activity() {
    private lateinit var logger: EmergencyLogger
    private lateinit var coordinator: EmergencyCoordinator
    private lateinit var locationProvider: LocationProvider
    private lateinit var geofenceStore: GeofenceStore
    private lateinit var evidenceRegistry: EvidenceRegistry
    private lateinit var volumeDetector: VolumeUpPressDetector
    private var shakeDetector: ShakeDetector? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        logger = EmergencyLogger(this)
        coordinator = EmergencyCoordinator(this)
        locationProvider = LocationProvider(this, logger)
        geofenceStore = GeofenceStore(this)
        evidenceRegistry = EvidenceRegistry(this)
        volumeDetector = VolumeUpPressDetector {
            trigger(EmergencyTriggerType.VOLUME_UP_SEVEN_TIMES, "main_activity")
        }
        setContentView(buildContentView())
    }

    override fun onResume() {
        super.onResume()
        shakeDetector = ShakeDetector(this, logger) {
            trigger(EmergencyTriggerType.DEVICE_SHAKE, "main_activity")
        }.also { it.start() }
    }

    override fun onPause() {
        shakeDetector?.stop()
        shakeDetector = null
        super.onPause()
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_VOLUME_UP && event.action == KeyEvent.ACTION_UP) {
            volumeDetector.onVolumeUpPressed()
        }
        return super.dispatchKeyEvent(event)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_EVIDENCE && resultCode == RESULT_OK) {
            val uri = data?.data ?: return
            val flags = data.flags and
                (Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            runCatching {
                contentResolver.takePersistableUriPermission(
                    uri,
                    flags and Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
            }.onFailure { error ->
                logger.event("evidence_permission_persist_failed", mapOf("error" to error.message))
            }
            evidenceRegistry.register(uri)
            logger.event("evidence_registered", mapOf("uri" to uri.toString()))
            toast("Evidence registered for emergency uploads")
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        logger.event(
            "permission_result",
            mapOf(
                "requestCode" to requestCode,
                "permissions" to permissions.joinToString(","),
                "granted" to grantResults.count { it == PackageManager.PERMISSION_GRANTED }
            )
        )
    }

    private fun buildContentView(): ScrollView {
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 32, 32, 32)
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

        container.addView(TextView(this).apply {
            text = "Emergency Response\n\n" +
                "SOS triggers immediately. Press Volume Up 7 times while this screen is open to trigger. " +
                "Shake and geofence triggers run while the app is visible or while safety monitoring is active. " +
                "Background monitoring uses a visible foreground-service notification."
            textSize = 18f
        })

        container.addButton("Request foreground permissions") { requestForegroundPermissions() }
        container.addButton("Open background location settings") { openBackgroundLocationSettings() }
        container.addButton("SOS Button") { trigger(EmergencyTriggerType.SOS_BUTTON, "sos_button") }
        container.addButton("Start safety monitoring") { startMonitoringService() }
        container.addButton("Stop safety monitoring") { stopService(EmergencyTrackingService.stopIntent(this)) }
        container.addButton("Set geofence to current location") { setGeofenceToCurrentLocation() }
        container.addButton("Register evidence file") { registerEvidenceFile() }

        return ScrollView(this).apply { addView(container) }
    }

    private fun LinearLayout.addButton(label: String, onClick: () -> Unit) {
        addView(Button(this@MainActivity).apply {
            text = label
            setOnClickListener { onClick() }
        })
    }

    private fun trigger(type: EmergencyTriggerType, source: String) {
        coordinator.triggerEmergency(EmergencyTrigger(type = type, source = source)) {
            runOnUiThread { toast("Emergency triggered: ${type.name}") }
        }
    }

    private fun requestForegroundPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions += Manifest.permission.POST_NOTIFICATIONS
            permissions += Manifest.permission.READ_MEDIA_IMAGES
            permissions += Manifest.permission.READ_MEDIA_VIDEO
            permissions += Manifest.permission.READ_MEDIA_AUDIO
        } else {
            permissions += Manifest.permission.READ_EXTERNAL_STORAGE
        }

        val missing = permissions
            .filter { checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED }
            .toTypedArray()
        if (missing.isEmpty()) {
            toast("Foreground permissions already granted")
            return
        }
        requestPermissions(missing, REQUEST_FOREGROUND_PERMISSIONS)
    }

    private fun openBackgroundLocationSettings() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            toast("Background location is granted with foreground location on this Android version")
            return
        }
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.fromParts("package", packageName, null)
        }
        startActivity(intent)
        logger.event("background_location_settings_opened")
    }

    private fun startMonitoringService() {
        val intent = EmergencyTrackingService.monitoringIntent(this)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        toast("Safety monitoring started")
    }

    private fun setGeofenceToCurrentLocation() {
        locationProvider.getCurrentLocation { location ->
            runOnUiThread {
                if (location == null) {
                    toast("Location permission or provider unavailable")
                    return@runOnUiThread
                }
                geofenceStore.save(
                    EmergencyGeofence(
                        latitude = location.latitude,
                        longitude = location.longitude,
                        radiusMeters = DEFAULT_GEOFENCE_RADIUS_METERS,
                        name = "Current safety zone"
                    )
                )
                logger.event(
                    "geofence_saved",
                    mapOf(
                        "latitude" to location.latitude,
                        "longitude" to location.longitude,
                        "radiusMeters" to DEFAULT_GEOFENCE_RADIUS_METERS
                    )
                )
                toast("Geofence saved at current location")
            }
        }
    }

    private fun registerEvidenceFile() {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
        }
        startActivityForResult(intent, REQUEST_EVIDENCE)
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    companion object {
        private const val REQUEST_FOREGROUND_PERMISSIONS = 1001
        private const val REQUEST_EVIDENCE = 1002
        private const val DEFAULT_GEOFENCE_RADIUS_METERS = 150.0
    }
}
