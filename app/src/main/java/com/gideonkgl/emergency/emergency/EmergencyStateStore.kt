package com.gideonkgl.emergency.emergency

import android.content.Context

class EmergencyStateStore(context: Context) {
    private val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

    fun setActiveEmergency(emergencyId: String, incidentId: String?) {
        preferences.edit()
            .putString(KEY_EMERGENCY_ID, emergencyId)
            .putString(KEY_INCIDENT_ID, incidentId)
            .apply()
    }

    fun clearActiveEmergency() {
        preferences.edit()
            .remove(KEY_EMERGENCY_ID)
            .remove(KEY_INCIDENT_ID)
            .apply()
    }

    fun activeEmergencyId(): String? =
        preferences.getString(KEY_EMERGENCY_ID, null)?.takeIf { it.isNotBlank() }

    fun activeIncidentId(): String? =
        preferences.getString(KEY_INCIDENT_ID, null)?.takeIf { it.isNotBlank() }

    companion object {
        private const val PREFERENCES_NAME = "emergency_state"
        private const val KEY_EMERGENCY_ID = "active_emergency_id"
        private const val KEY_INCIDENT_ID = "active_incident_id"
    }
}
