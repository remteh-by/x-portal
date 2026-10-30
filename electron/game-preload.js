import {contextBridge,ipcRenderer} from 'electron';
import {installVirtualGamepad} from './virtual-gamepad.js';
import {gamePage} from './navigation.js';
let generation=0;
async function activate() {
 const request=++generation;
 if(!gamePage(location.href)){contextBridge.executeInMainWorld({func:()=>window.__xplayControls?.destroy()});return;}
 try {
  const profile=await ipcRenderer.invoke('xplay:profile');
  if(request!==generation || !gamePage(location.href))return;
  contextBridge.executeInMainWorld({func:installVirtualGamepad,args:[profile]});
 }catch{console.warn('X Play controls unavailable. Physical Gamepad API remains available.');}
}
window.addEventListener('DOMContentLoaded',activate);
ipcRenderer.on('xplay:route',activate);
