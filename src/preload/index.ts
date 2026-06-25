import { contextBridge, ipcRenderer } from "electron";

const api = {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke("app:get-version")
};

contextBridge.exposeInMainWorld("monitoringConsole", api);

export type MonitoringConsoleApi = typeof api;
