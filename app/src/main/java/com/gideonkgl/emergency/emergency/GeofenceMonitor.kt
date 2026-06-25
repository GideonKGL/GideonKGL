package com.gideonkgl.emergency.emergency

import android.content.Context
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

data class EmergencyGeofence(
    val latitude: Double,
    val longitude: Double,
    val radiusMeters: Double,
    val name: String
)

class GeofenceStore(context: Context) {
    private val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

    fun save(geofence: EmergencyGeofence) {
        preferences.edit()
            .putString(KEY_LATITUDE, geofence.latitude.toString())
            .putString(KEY_LONGITUDE, geofence.longitude.toString())
            .putString(KEY_RADIUS_METERS, geofence.radiusMeters.toString())
            .putString(KEY_NAME, geofence.name)
            .apply()
    }

    fun current(): EmergencyGeofence? {
        if (!preferences.contains(KEY_LATITUDE) || !preferences.contains(KEY_LONGITUDE)) return null
        return EmergencyGeofence(
            latitude = preferences.getString(KEY_LATITUDE, null)?.toDoubleOrNull() ?: return null,
            longitude = preferences.getString(KEY_LONGITUDE, null)?.toDoubleOrNull() ?: return null,
            radiusMeters = preferences.getString(KEY_RADIUS_METERS, null)?.toDoubleOrNull()
                ?: DEFAULT_RADIUS_METERS,
            name = preferences.getString(KEY_NAME, "Safety zone") ?: "Safety zone"
        )
    }

    companion object {
        private const val PREFERENCES_NAME = "emergency_geofence"
        private const val KEY_LATITUDE = "latitude"
        private const val KEY_LONGITUDE = "longitude"
        private const val KEY_RADIUS_METERS = "radius_meters"
        private const val KEY_NAME = "name"
        private const val DEFAULT_RADIUS_METERS = 150.0
    }
}

class GeofenceMonitor(
    private val store: GeofenceStore,
    private val logger: EmergencyLogger,
    private val onViolation: (EmergencyGeofence, Double) -> Unit
) {
    private var violationActive = false

    fun evaluate(location: EmergencyLocation) {
        val geofence = store.current() ?: return
        val distance = distanceMeters(
            location.latitude,
            location.longitude,
            geofence.latitude,
            geofence.longitude
        )
        val violated = distance > geofence.radiusMeters

        if (violated && !violationActive) {
            violationActive = true
            logger.event(
                "geofence_violation_detected",
                mapOf(
                    "name" to geofence.name,
                    "distanceMeters" to distance,
                    "radiusMeters" to geofence.radiusMeters
                )
            )
            onViolation(geofence, distance)
        } else if (!violated && violationActive) {
            violationActive = false
            logger.event("geofence_reentered", mapOf("name" to geofence.name))
        }
    }

    private fun distanceMeters(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val earthRadiusMeters = 6_371_000.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val startLat = Math.toRadians(lat1)
        val endLat = Math.toRadians(lat2)
        val a = sin(dLat / 2) * sin(dLat / 2) +
            cos(startLat) * cos(endLat) * sin(dLon / 2) * sin(dLon / 2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return earthRadiusMeters * c
    }
}
