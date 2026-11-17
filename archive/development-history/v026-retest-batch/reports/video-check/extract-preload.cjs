const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('offlineDecoder', {
  source: () => ipcRenderer.invoke('offline:source'),
  frame: data => ipcRenderer.invoke('offline:frame', data),
  complete: metadata => ipcRenderer.invoke('offline:complete', metadata),
  error: message => ipcRenderer.invoke('offline:error', message)
});
