package com.gideonkgl.emergency.emergency

import android.location.Location
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

enum class EmergencyTriggerType {
    SOS_BUTTON,
    VOLUME_UP_SEVEN_TIMES,
    DEVICE_SHAKE,
    GEOFENCE_VIOLATION
}

data class EmergencyTrigger(
    val type: EmergencyTriggerType,
    val source: String,
    val occurredAtMillis: Long = System.currentTimeMillis(),
    val metadata: Map<String, String> = emptyMap()
)

data class EmergencyLocation(
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Float?,
    val altitudeMeters: Double?,
    val speedMetersPerSecond: Float?,
    val bearingDegrees: Float?,
    val provider: String?,
    val capturedAtMillis: Long
) {
    fun toJson(): JSONObject = JSONObject()
        .put("latitude", latitude)
        .put("longitude", longitude)
        .put("accuracyMeters", accuracyMeters)
        .put("altitudeMeters", altitudeMeters)
        .put("speedMetersPerSecond", speedMetersPerSecond)
        .put("bearingDegrees", bearingDegrees)
        .put("provider", provider)
        .put("capturedAtMillis", capturedAtMillis)

    companion object {
        fun from(location: Location): EmergencyLocation = EmergencyLocation(
            latitude = location.latitude,
            longitude = location.longitude,
            accuracyMeters = if (location.hasAccuracy()) location.accuracy else null,
            altitudeMeters = if (location.hasAltitude()) location.altitude else null,
            speedMetersPerSecond = if (location.hasSpeed()) location.speed else null,
            bearingDegrees = if (location.hasBearing()) location.bearing else null,
            provider = location.provider,
            capturedAtMillis = location.time.takeIf { it > 0L } ?: System.currentTimeMillis()
        )
    }
}

data class EmergencyAlertRequest(
    val emergencyId: String = UUID.randomUUID().toString(),
    val trigger: EmergencyTrigger,
    val location: EmergencyLocation?,
    val createIncident: Boolean = true,
    val notifyDesktopConsole: Boolean = true
) {
    fun toJson(): JSONObject {
        val metadataJson = JSONObject()
        trigger.metadata.forEach { (key, value) -> metadataJson.put(key, value) }

        return JSONObject()
            .put("emergencyId", emergencyId)
            .put("trigger", trigger.type.name)
            .put("source", trigger.source)
            .put("occurredAtMillis", trigger.occurredAtMillis)
            .put("metadata", metadataJson)
            .put("location", location?.toJson())
            .put("createIncident", createIncident)
            .put("notifyDesktopConsole", notifyDesktopConsole)
    }
}

data class EmergencyAlertResponse(
    val emergencyId: String,
    val incidentId: String?,
    val accepted: Boolean
) {
    companion object {
        fun fromJson(json: JSONObject, fallbackEmergencyId: String): EmergencyAlertResponse =
            EmergencyAlertResponse(
                emergencyId = json.optString("emergencyId", fallbackEmergencyId),
                incidentId = json.optString("incidentId").takeIf { it.isNotBlank() },
                accepted = json.optBoolean("accepted", true)
            )
    }
}

data class EvidenceItem(
    val name: String,
    val mimeType: String,
    val bytes: ByteArray
)

data class TrackingUpdate(
    val emergencyId: String,
    val incidentId: String?,
    val location: EmergencyLocation,
    val recordedAtMillis: Long = System.currentTimeMillis()
) {
    fun toJson(): JSONObject = JSONObject()
        .put("emergencyId", emergencyId)
        .put("incidentId", incidentId)
        .put("recordedAtMillis", recordedAtMillis)
        .put("location", location.toJson())
}

data class EvidenceUploadSummary(
    val attempted: Int,
    val uploaded: Int,
    val skippedReason: String?
) {
    fun toJson(): JSONObject = JSONObject()
        .put("attempted", attempted)
        .put("uploaded", uploaded)
        .put("skippedReason", skippedReason)
}

fun Map<String, String>.toJsonArray(): JSONArray {
    val array = JSONArray()
    forEach { (key, value) ->
        array.put(JSONObject().put("key", key).put("value", value))
    }
    return array
}
