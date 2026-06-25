package com.gideonkgl.emergency.emergency

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import kotlin.math.sqrt

class ShakeDetector(
    context: Context,
    private val logger: EmergencyLogger,
    private val onShake: () -> Unit
) : SensorEventListener {
    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private var lastShakeMillis = 0L

    fun start(): Boolean {
        if (accelerometer == null) {
            logger.event("shake_detector_unavailable")
            return false
        }

        return sensorManager.registerListener(
            this,
            accelerometer,
            SensorManager.SENSOR_DELAY_UI
        ).also { registered ->
            logger.event("shake_detector_started", mapOf("registered" to registered))
        }
    }

    fun stop() {
        sensorManager.unregisterListener(this)
        logger.event("shake_detector_stopped")
    }

    override fun onSensorChanged(event: SensorEvent) {
        val x = event.values[0]
        val y = event.values[1]
        val z = event.values[2]
        val acceleration = sqrt((x * x + y * y + z * z).toDouble()) / SensorManager.GRAVITY_EARTH
        val now = System.currentTimeMillis()

        if (acceleration >= SHAKE_THRESHOLD_GRAVITY && now - lastShakeMillis >= SHAKE_COOLDOWN_MS) {
            lastShakeMillis = now
            logger.event("shake_detected", mapOf("accelerationG" to acceleration))
            onShake()
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

    companion object {
        private const val SHAKE_THRESHOLD_GRAVITY = 2.7
        private const val SHAKE_COOLDOWN_MS = 15_000L
    }
}
