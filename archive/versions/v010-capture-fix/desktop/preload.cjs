const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('collector',{start:input=>ipcRenderer.invoke('collector:start',input),retry:()=>ipcRenderer.invoke('collector:retry'),onState:callback=>ipcRenderer.on('collector:state',(_,state)=>callback(state))});
