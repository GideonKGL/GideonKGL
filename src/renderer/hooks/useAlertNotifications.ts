import { useEffect, useRef, useState } from "react";
import type { SosAlert } from "@shared/types";

function playAlertTone() {
  const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextConstructor) {
    return;
  }

  const audioContext = new AudioContextConstructor();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(1320, audioContext.currentTime + 0.18);
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.24, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.65);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.7);

  window.setTimeout(() => {
    void audioContext.close();
  }, 900);
}

export function useAlertNotifications(latestAlert?: SosAlert) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(false);
  const lastAlertId = useRef<string | undefined>();

  useEffect(() => {
    if (!("Notification" in window)) {
      return;
    }

    if (Notification.permission === "granted") {
      setDesktopNotificationsEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!latestAlert || latestAlert.id === lastAlertId.current) {
      return;
    }

    lastAlertId.current = latestAlert.id;

    if (soundEnabled) {
      playAlertTone();
    }

    if (desktopNotificationsEnabled && "Notification" in window) {
      new Notification("Incoming SOS Alert", {
        body: latestAlert.message,
        tag: latestAlert.id,
        requireInteraction: true
      });
    }
  }, [desktopNotificationsEnabled, latestAlert, soundEnabled]);

  async function requestDesktopNotifications() {
    if (!("Notification" in window)) {
      return;
    }

    const permission = await Notification.requestPermission();
    setDesktopNotificationsEnabled(permission === "granted");
  }

  return {
    soundEnabled,
    setSoundEnabled,
    desktopNotificationsEnabled,
    requestDesktopNotifications
  };
}
