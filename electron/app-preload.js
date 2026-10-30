import {contextBridge,ipcRenderer} from 'electron'
contextBridge.exposeInMainWorld('xplay',{
  info:()=>ipcRenderer.invoke('xplay:info'),
  profile:()=>ipcRenderer.invoke('xplay:profile'),
  saveProfile:profile=>ipcRenderer.invoke('xplay:save-profile',profile),
  openGame:mode=>ipcRenderer.invoke('xplay:open-game',mode),
})
