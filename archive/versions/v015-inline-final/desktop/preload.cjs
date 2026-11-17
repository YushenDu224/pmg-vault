const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('pmgDesktop',Object.freeze({
start:input=>ipcRenderer.invoke('pmg:start',{site:input.site,cert:input.cert,grade:input.grade}),
readMigration:()=>ipcRenderer.invoke('pmg:migration'),retry:()=>ipcRenderer.invoke('pmg:retry'),reload:()=>ipcRenderer.invoke('pmg:reload'),getState:()=>ipcRenderer.invoke('pmg:state'),readArchive:id=>ipcRenderer.invoke('pmg:archive',id),
layout:input=>ipcRenderer.send('pmg:layout',input),ready:()=>ipcRenderer.send('pmg:ready'),
onState:callback=>{const listener=(_,state)=>callback(state);ipcRenderer.on('pmg:state',listener);return ()=>ipcRenderer.removeListener('pmg:state',listener);},
onQuery:callback=>{const listener=(_,query)=>callback(query);ipcRenderer.on('pmg:query',listener);return ()=>ipcRenderer.removeListener('pmg:query',listener);}
}));
