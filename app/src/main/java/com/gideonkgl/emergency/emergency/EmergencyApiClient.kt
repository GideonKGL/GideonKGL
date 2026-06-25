package com.gideonkgl.emergency.emergency

import android.content.Context
import com.gideonkgl.emergency.R
import org.json.JSONObject
import java.io.BufferedOutputStream
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class EmergencyApiClient(context: Context, private val logger: EmergencyLogger) {
    private val baseUrl = context.getString(R.string.emergency_backend_base_url).trimEnd('/')

    fun sendAlert(request: EmergencyAlertRequest): EmergencyAlertResponse {
        val response = postJson("/emergency/alerts", request.toJson())
        return EmergencyAlertResponse.fromJson(JSONObject(response), request.emergencyId)
    }

    fun sendTrackingUpdate(update: TrackingUpdate) {
        postJson("/emergency/tracking", update.toJson())
    }

    fun uploadEvidence(emergencyId: String, incidentId: String?, evidence: EvidenceItem) {
        val boundary = "----EmergencyBoundary${System.currentTimeMillis()}"
        val connection = openConnection("/emergency/evidence").apply {
            requestMethod = "POST"
            doOutput = true
            setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
        }

        runCatching {
            BufferedOutputStream(connection.outputStream).use { output ->
                fun writePartHeader(name: String, fileName: String? = null, contentType: String? = null) {
                    val disposition = buildString {
                        append("Content-Disposition: form-data; name=\"").append(name).append('"')
                        if (fileName != null) append("; filename=\"").append(fileName).append('"')
                    }
                    output.write("--$boundary\r\n".toByteArray())
                    output.write("$disposition\r\n".toByteArray())
                    if (contentType != null) output.write("Content-Type: $contentType\r\n".toByteArray())
                    output.write("\r\n".toByteArray())
                }

                writePartHeader("emergencyId")
                output.write(emergencyId.toByteArray())
                output.write("\r\n".toByteArray())

                if (incidentId != null) {
                    writePartHeader("incidentId")
                    output.write(incidentId.toByteArray())
                    output.write("\r\n".toByteArray())
                }

                writePartHeader("file", evidence.name, evidence.mimeType)
                output.write(evidence.bytes)
                output.write("\r\n--$boundary--\r\n".toByteArray())
            }
            readResponse(connection)
        }.onFailure { error ->
            logger.event(
                "evidence_upload_failed",
                mapOf("name" to evidence.name, "error" to error.message)
            )
            throw error
        }
    }

    private fun postJson(path: String, body: JSONObject): String {
        val connection = openConnection(path).apply {
            requestMethod = "POST"
            doOutput = true
            setRequestProperty("Content-Type", "application/json; charset=utf-8")
        }

        OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
            writer.write(body.toString())
        }
        return readResponse(connection)
    }

    private fun openConnection(path: String): HttpURLConnection =
        (URL("$baseUrl$path").openConnection() as HttpURLConnection).apply {
            connectTimeout = CONNECT_TIMEOUT_MS
            readTimeout = READ_TIMEOUT_MS
            setRequestProperty("Accept", "application/json")
        }

    private fun readResponse(connection: HttpURLConnection): String {
        val code = connection.responseCode
        val stream = if (code in 200..299) connection.inputStream else connection.errorStream
        val body = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
        connection.disconnect()

        if (code !in 200..299) {
            throw IllegalStateException("Backend returned HTTP $code: $body")
        }
        return body.ifBlank { "{}" }
    }

    companion object {
        private const val CONNECT_TIMEOUT_MS = 15_000
        private const val READ_TIMEOUT_MS = 20_000
    }
}
