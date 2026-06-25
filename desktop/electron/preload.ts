import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("guardian", {
  notifySos: (payload: { title: string; body: string }) => ipcRenderer.invoke("notify:sos", payload)
});
