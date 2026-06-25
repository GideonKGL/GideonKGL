package com.gideonkgl.emergency.emergency

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.CancellationSignal
import android.os.Handler
import android.os.Looper
import java.util.concurrent.Executor
import java.util.function.Consumer

class LocationProvider(private val context: Context, private val logger: EmergencyLogger) {
    private val locationManager =
        context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    private val mainHandler = Handler(Looper.getMainLooper())
    private val mainExecutor = Executor { command -> mainHandler.post(command) }

    fun hasForegroundLocationPermission(): Boolean =
        context.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
            context.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

    fun hasBackgroundLocationPermission(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.Q ||
            context.checkSelfPermission(Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED

    @SuppressLint("MissingPermission")
    fun getCurrentLocation(callback: (EmergencyLocation?) -> Unit) {
        if (!hasForegroundLocationPermission()) {
            logger.event("location_permission_missing")
            callback(null)
            return
        }

        val provider = bestProvider()
        if (provider == null) {
            logger.event("location_provider_unavailable")
            callback(lastKnownLocation())
            return
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val cancellationSignal = CancellationSignal()
            var delivered = false
            mainHandler.postDelayed({
                if (delivered) return@postDelayed
                delivered = true
                cancellationSignal.cancel()
                callback(lastKnownLocation())
            }, CURRENT_LOCATION_TIMEOUT_MS)
            locationManager.getCurrentLocation(
                provider,
                cancellationSignal,
                mainExecutor,
                Consumer<Location?> { location ->
                    if (delivered) return@Consumer
                    delivered = true
                    callback(location?.let(EmergencyLocation::from) ?: lastKnownLocation())
                }
            )
            return
        }

        var delivered = false
        val listener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                if (delivered) return
                delivered = true
                locationManager.removeUpdates(this)
                callback(EmergencyLocation.from(location))
            }

            @Deprecated("Deprecated in Android framework")
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) = Unit

            override fun onProviderEnabled(provider: String) = Unit

            override fun onProviderDisabled(provider: String) = Unit
        }

        runCatching {
            locationManager.requestSingleUpdate(provider, listener, Looper.getMainLooper())
            mainHandler.postDelayed({
                if (delivered) return@postDelayed
                delivered = true
                locationManager.removeUpdates(listener)
                callback(lastKnownLocation())
            }, CURRENT_LOCATION_TIMEOUT_MS)
        }.onFailure { error ->
            logger.event("location_capture_failed", mapOf("error" to error.message))
            callback(lastKnownLocation())
        }
    }

    @SuppressLint("MissingPermission")
    fun startLocationUpdates(
        intervalMillis: Long,
        onLocation: (EmergencyLocation) -> Unit
    ): LocationUpdateHandle? {
        if (!hasForegroundLocationPermission()) {
            logger.event("tracking_location_permission_missing")
            return null
        }

        val provider = bestProvider()
        if (provider == null) {
            logger.event("tracking_location_provider_unavailable")
            return null
        }

        val listener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                onLocation(EmergencyLocation.from(location))
            }

            @Deprecated("Deprecated in Android framework")
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) = Unit

            override fun onProviderEnabled(provider: String) = Unit

            override fun onProviderDisabled(provider: String) = Unit
        }

        return runCatching {
            locationManager.requestLocationUpdates(
                provider,
                intervalMillis,
                0f,
                listener,
                Looper.getMainLooper()
            )
            LocationUpdateHandle { locationManager.removeUpdates(listener) }
        }.onFailure { error ->
            logger.event("tracking_location_updates_failed", mapOf("error" to error.message))
        }.getOrNull()
    }

    @SuppressLint("MissingPermission")
    private fun lastKnownLocation(): EmergencyLocation? {
        if (!hasForegroundLocationPermission()) return null

        return locationManager.getProviders(true)
            .mapNotNull { provider ->
                runCatching { locationManager.getLastKnownLocation(provider) }.getOrNull()
            }
            .maxByOrNull { it.time }
            ?.let(EmergencyLocation::from)
    }

    private fun bestProvider(): String? {
        val providers = locationManager.getProviders(true)
        return when {
            LocationManager.GPS_PROVIDER in providers -> LocationManager.GPS_PROVIDER
            LocationManager.NETWORK_PROVIDER in providers -> LocationManager.NETWORK_PROVIDER
            else -> null
        }
    }

    companion object {
        private const val CURRENT_LOCATION_TIMEOUT_MS = 10_000L
    }
}

class LocationUpdateHandle(private val stopUpdates: () -> Unit) {
    fun stop() = stopUpdates()
}
