package com.gideonkgl.emergency.emergency

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.OpenableColumns
import java.io.File
import java.io.ByteArrayOutputStream
import java.io.InputStream

class EvidenceRegistry(private val context: Context) {
    private val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

    fun register(uri: Uri) {
        val uris = registeredUris().toMutableSet()
        uris.add(uri.toString())
        preferences.edit().putStringSet(KEY_URIS, uris).apply()
    }

    fun registeredUris(): Set<String> = preferences.getStringSet(KEY_URIS, emptySet()).orEmpty()

    companion object {
        private const val PREFERENCES_NAME = "emergency_evidence"
        private const val KEY_URIS = "registered_uris"
    }
}

class EvidenceUploader(
    private val context: Context,
    private val apiClient: EmergencyApiClient,
    private val logger: EmergencyLogger
) {
    private val registry = EvidenceRegistry(context)

    fun uploadAvailableEvidence(emergencyId: String, incidentId: String?): EvidenceUploadSummary {
        val evidence = collectEvidence()
        if (evidence.isEmpty()) {
            val reason = if (hasMediaReadPermission()) {
                "no_registered_or_app_private_evidence"
            } else {
                "media_permission_not_granted"
            }
            logger.event("evidence_upload_skipped", mapOf("reason" to reason))
            return EvidenceUploadSummary(attempted = 0, uploaded = 0, skippedReason = reason)
        }

        var uploaded = 0
        evidence.forEach { item ->
            runCatching {
                apiClient.uploadEvidence(emergencyId, incidentId, item)
                uploaded += 1
                logger.event("evidence_uploaded", mapOf("name" to item.name))
            }
        }
        return EvidenceUploadSummary(attempted = evidence.size, uploaded = uploaded, skippedReason = null)
    }

    private fun collectEvidence(): List<EvidenceItem> {
        val items = mutableListOf<EvidenceItem>()
        appPrivateEvidenceDirectory()
            .listFiles()
            ?.filter { it.isFile && it.length() in 1..MAX_EVIDENCE_BYTES }
            ?.forEach { file ->
                items.add(
                    EvidenceItem(
                        name = file.name,
                        mimeType = guessMimeType(file.name),
                        bytes = file.readBytes()
                    )
                )
            }

        registry.registeredUris().forEach { uriString ->
            val uri = Uri.parse(uriString)
            val bytes = readRegisteredEvidence(uri) ?: return@forEach
            if (bytes.isNotEmpty() && bytes.size <= MAX_EVIDENCE_BYTES) {
                items.add(
                    EvidenceItem(
                        name = displayName(uri),
                        mimeType = context.contentResolver.getType(uri) ?: "application/octet-stream",
                        bytes = bytes
                    )
                )
            }
        }

        return items
    }

    private fun readRegisteredEvidence(uri: Uri): ByteArray? {
        return runCatching {
            context.contentResolver.openInputStream(uri)?.use { input ->
                input.readBytesBounded(MAX_EVIDENCE_BYTES + 1)
            }
        }.onFailure { error ->
            logger.event(
                "registered_evidence_read_failed",
                mapOf("uri" to uri.toString(), "error" to error.message)
            )
        }.getOrNull()
    }

    private fun displayName(uri: Uri): String {
        val projection = arrayOf(OpenableColumns.DISPLAY_NAME)
        context.contentResolver.query(uri, projection, null, null, null)?.use { cursor ->
            val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (index >= 0 && cursor.moveToFirst()) {
                return cursor.getString(index)
            }
        }
        return uri.lastPathSegment ?: "evidence.bin"
    }

    private fun hasMediaReadPermission(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return context.checkSelfPermission(Manifest.permission.READ_MEDIA_IMAGES) == PackageManager.PERMISSION_GRANTED ||
                context.checkSelfPermission(Manifest.permission.READ_MEDIA_VIDEO) == PackageManager.PERMISSION_GRANTED ||
                context.checkSelfPermission(Manifest.permission.READ_MEDIA_AUDIO) == PackageManager.PERMISSION_GRANTED
        }
        return context.checkSelfPermission(Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED
    }

    private fun appPrivateEvidenceDirectory(): File =
        File(context.filesDir, "evidence").apply { mkdirs() }

    private fun guessMimeType(name: String): String =
        when (name.substringAfterLast('.', "").lowercase()) {
            "jpg", "jpeg" -> "image/jpeg"
            "png" -> "image/png"
            "mp4" -> "video/mp4"
            "m4a" -> "audio/mp4"
            "aac" -> "audio/aac"
            "txt", "log" -> "text/plain"
            else -> "application/octet-stream"
        }

    companion object {
        private const val MAX_EVIDENCE_BYTES = 10 * 1024 * 1024
    }
}

private fun InputStream.readBytesBounded(maxBytes: Int): ByteArray {
    val output = ByteArrayOutputStream()
    val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
    var total = 0
    while (true) {
        val read = read(buffer)
        if (read == -1) break
        total += read
        if (total > maxBytes) {
            throw IllegalStateException("Evidence item exceeds maximum size")
        }
        output.write(buffer, 0, read)
    }
    return output.toByteArray()
}
