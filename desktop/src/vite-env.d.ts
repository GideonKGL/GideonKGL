/// <reference types="vite/client" />

interface Window {
  guardian?: {
    notifySos: (payload: { title: string; body: string }) => Promise<void>;
  };
}
