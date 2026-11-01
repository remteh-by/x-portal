import {contextBridge,ipcRenderer} from 'electron'
contextBridge.exposeInMainWorld('xplay',{
  info:()=>ipcRenderer.invoke('xplay:info'),
  profile:()=>ipcRenderer.invoke('xplay:profile'),
  saveProfile:profile=>ipcRenderer.invoke('xplay:save-profile',profile),
  library:()=>ipcRenderer.invoke('xplay:library'),
  saveLibrary:library=>ipcRenderer.invoke('xplay:save-library',library),
  openGame:mode=>ipcRenderer.invoke('xplay:open-game',mode),
  support:id=>ipcRenderer.invoke('xplay:support',id),
})
