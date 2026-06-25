/// <reference types="vite/client" />

declare global {
  interface Window {
    monitoringConsole?: {
      getAppVersion: () => Promise<string>;
    };
    webkitAudioContext?: typeof AudioContext;
  }
}

export {};
