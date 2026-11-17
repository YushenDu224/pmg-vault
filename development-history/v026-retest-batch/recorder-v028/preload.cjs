const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('recorderBridge', Object.freeze({
  started: metadata => ipcRenderer.invoke('recorder:started', metadata),
  chunk: bytes => ipcRenderer.invoke('recorder:chunk', bytes),
  finished: () => ipcRenderer.invoke('recorder:finished'),
  error: message => ipcRenderer.invoke('recorder:error', message),
  onStop: callback => ipcRenderer.once('recorder:stop', callback)
}));
