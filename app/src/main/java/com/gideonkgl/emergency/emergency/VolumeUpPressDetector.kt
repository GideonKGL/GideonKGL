package com.gideonkgl.emergency.emergency

class VolumeUpPressDetector(
    private val requiredPresses: Int = 7,
    private val windowMillis: Long = 8_000L,
    private val onTriggered: () -> Unit
) {
    private val pressTimes = ArrayDeque<Long>()

    fun onVolumeUpPressed(nowMillis: Long = System.currentTimeMillis()) {
        pressTimes.addLast(nowMillis)
        while (pressTimes.isNotEmpty() && nowMillis - pressTimes.first() > windowMillis) {
            pressTimes.removeFirst()
        }

        if (pressTimes.size >= requiredPresses) {
            pressTimes.clear()
            onTriggered()
        }
    }
}
