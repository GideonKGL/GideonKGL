package com.gideonkgl.emergency.emergency

import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONObject
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.UUID

class EmergencyCoordinator(private val context: Context) {
    private val appContext = context.applicationContext
    private val logger = EmergencyLogger(appContext)
    private val locationProvider = LocationProvider(appContext, logger)
    private val apiClient = EmergencyApiClient(appContext, logger)
    private val evidenceUploader = EvidenceUploader(appContext, apiClient, logger)
    private val stateStore = EmergencyStateStore(appContext)
    private val executor: ExecutorService = Executors.newSingleThreadExecutor()

    fun triggerEmergency(trigger: EmergencyTrigger, completion: ((EmergencyAlertResponse?) -> Unit)? = null) {
        val activeEmergencyId = stateStore.activeEmergencyId()
        if (activeEmergencyId != null) {
            logger.event(
                "emergency_trigger_received_while_active",
                mapOf(
                    "activeEmergencyId" to activeEmergencyId,
                    "trigger" to trigger.type.name,
                    "source" to trigger.source
                )
            )
            completion?.invoke(null)
            return
        }

        val emergencyId = UUID.randomUUID().toString()
        logger.event(
            "emergency_triggered",
            mapOf("emergencyId" to emergencyId, "trigger" to trigger.type.name, "source" to trigger.source)
        )
        stateStore.setActiveEmergency(emergencyId, null)
        startEmergencyTracking(emergencyId, null)

        locationProvider.getCurrentLocation { location ->
            executor.execute {
                val request = EmergencyAlertRequest(
                    emergencyId = emergencyId,
                    trigger = trigger,
                    location = location
                )
                val response = sendAlert(request)
                val incidentId = response?.incidentId

                stateStore.setActiveEmergency(request.emergencyId, incidentId)

                val uploadSummary = evidenceUploader.uploadAvailableEvidence(request.emergencyId, incidentId)
                logger.event(
                    "emergency_response_sequence_completed",
                    mapOf(
                        "emergencyId" to request.emergencyId,
                        "incidentId" to incidentId,
                        "evidence" to uploadSummary.toJson()
                    )
                )
                completion?.invoke(response)
            }
        }
    }

    fun sendTrackingUpdate(location: EmergencyLocation) {
        val emergencyId = stateStore.activeEmergencyId()
        if (emergencyId == null) {
            logger.event("tracking_update_skipped", mapOf("reason" to "no_active_emergency"))
            return
        }

        executor.execute {
            val incidentId = stateStore.activeIncidentId()
            runCatching {
                apiClient.sendTrackingUpdate(TrackingUpdate(emergencyId, incidentId, location))
                logger.event(
                    "tracking_update_sent",
                    mapOf("emergencyId" to emergencyId, "incidentId" to incidentId)
                )
            }.onFailure { error ->
                logger.event(
                    "tracking_update_failed",
                    mapOf("emergencyId" to emergencyId, "error" to error.message)
                )
            }
        }
    }

    private fun sendAlert(request: EmergencyAlertRequest): EmergencyAlertResponse? {
        return runCatching {
            apiClient.sendAlert(request).also { response ->
                logger.event(
                    "emergency_alert_sent",
                    mapOf(
                        "emergencyId" to response.emergencyId,
                        "incidentId" to response.incidentId,
                        "accepted" to response.accepted
                    )
                )
            }
        }.onFailure { error ->
            logger.event(
                "emergency_alert_failed",
                mapOf(
                    "emergencyId" to request.emergencyId,
                    "payload" to request.toJson().redactedForLog(),
                    "error" to error.message
                )
            )
        }.getOrNull()
    }

    private fun startEmergencyTracking(emergencyId: String, incidentId: String?) {
        val intent = EmergencyTrackingService.trackingIntent(appContext, emergencyId, incidentId)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            appContext.startForegroundService(intent)
        } else {
            appContext.startService(intent)
        }
        logger.event("emergency_tracking_requested", mapOf("emergencyId" to emergencyId))
    }
}

private fun JSONObject.redactedForLog(): JSONObject {
    val copy = JSONObject(toString())
    copy.remove("location")
    return copy
}
