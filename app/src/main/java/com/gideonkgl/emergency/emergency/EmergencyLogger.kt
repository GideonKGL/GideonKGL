package com.gideonkgl.emergency.emergency

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.io.File
import java.io.FileWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class EmergencyLogger(context: Context) {
    private val logFile: File = File(context.filesDir, "emergency-events.jsonl")
    private val lock = Any()

    fun event(name: String, fields: Map<String, Any?> = emptyMap()) {
        val now = System.currentTimeMillis()
        val json = JSONObject()
            .put("event", name)
            .put("timestampMillis", now)
            .put("timestamp", iso8601(now))

        for ((key, value) in fields) {
            json.put(key, value)
        }

        synchronized(lock) {
            runCatching {
                FileWriter(logFile, true).use { writer ->
                    writer.append(json.toString()).append('\n')
                }
            }.onFailure { error ->
                Log.w(TAG, "Failed to write emergency event log", error)
            }
        }
        Log.i(TAG, json.toString())
    }

    fun file(): File = logFile

    private fun iso8601(millis: Long): String {
        val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        formatter.timeZone = TimeZone.getTimeZone("UTC")
        return formatter.format(Date(millis))
    }

    companion object {
        private const val TAG = "EmergencyLogger"
    }
}
